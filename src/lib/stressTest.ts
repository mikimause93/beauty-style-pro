import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "./errorLogger";

interface TestResult {
  test_name: string;
  test_type: string;
  duration_ms: number;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
}

async function saveResult(r: TestResult) {
  await supabase.from("stress_test_results" as never).insert(r);
}

async function timedTest(name: string, type: string, fn: () => Promise<unknown>): Promise<TestResult> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration_ms = Math.round(performance.now() - start);
    const r: TestResult = { test_name: name, test_type: type, duration_ms, success: true, metadata: { result } };
    await saveResult(r);
    return r;
  } catch (err: unknown) {
    const duration_ms = Math.round(performance.now() - start);
    const errMsg = err instanceof Error ? err.message : String(err);
    const r: TestResult = { test_name: name, test_type: type, duration_ms, success: false, error_message: errMsg };
    logError({ error_type: "database", message: `Test failed: ${name}`, metadata: { error: errMsg } });
    await saveResult(r);
    return r;
  }
}

// ===== INDIVIDUAL TESTS =====

export async function testAuth(): Promise<TestResult> {
  return timedTest("Auth Session Check", "auth", async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { hasSession: !!data.session };
  });
}

export async function testDatabaseRead(): Promise<TestResult> {
  return timedTest("DB Read (profiles)", "database", async () => {
    const { data, error } = await supabase.from("profiles").select("id").limit(5);
    if (error) throw error;
    return { rowCount: data?.length };
  });
}

export async function testDatabaseWrite(): Promise<TestResult> {
  return timedTest("DB Write (page_views)", "database", async () => {
    const { error } = await supabase.from("page_views").insert({
      page_path: "/stress-test",
      device_type: "test",
      session_id: `stress-${Date.now()}`,
    });
    if (error) throw error;
    return { written: true };
  });
}

export async function testPostsCRUD(): Promise<TestResult> {
  return timedTest("Posts Read", "database", async () => {
    const { data, error } = await supabase.from("posts").select("id, caption").limit(10);
    if (error) throw error;
    return { count: data?.length };
  });
}

export async function testRealtimeConnection(): Promise<TestResult> {
  return timedTest("Realtime Connection", "realtime", async () => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        reject(new Error("Realtime connection timeout (5s)"));
      }, 5000);
      const channel = supabase.channel("stress-test-" + Date.now())
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve({ status: "connected" });
          } else if (status === "CHANNEL_ERROR") {
            clearTimeout(timeout);
            channel.unsubscribe();
            reject(new Error("Channel error"));
          }
        });
    });
  });
}

export async function testStorageBuckets(): Promise<TestResult> {
  return timedTest("Storage Buckets Check", "storage", async () => {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    return { buckets: data?.map((b) => b.name) };
  });
}

export async function testChatSystem(): Promise<TestResult> {
  return timedTest("Chat Conversations Read", "chat", async () => {
    const { data, error } = await supabase.from("conversations").select("id").limit(5);
    if (error) throw error;
    return { count: data?.length };
  });
}

export async function testWalletTransactions(): Promise<TestResult> {
  return timedTest("Transactions Read", "database", async () => {
    const { error } = await supabase.from("transactions" as never).select("id").limit(5);
    if (error) throw error;
    return { accessible: true };
  });
}

export async function testNotifications(): Promise<TestResult> {
  return timedTest("Notifications Read", "database", async () => {
    const { data, error } = await supabase.from("notifications").select("id").limit(5);
    if (error) throw error;
    return { count: data?.length };
  });
}

export async function testProducts(): Promise<TestResult> {
  return timedTest("Products Read", "database", async () => {
    const { data, error } = await supabase.from("products").select("id").limit(10);
    if (error) throw error;
    return { count: data?.length };
  });
}

export async function testServices(): Promise<TestResult> {
  return timedTest("Services Read", "database", async () => {
    const { data, error } = await supabase.from("services").select("id").limit(10);
    if (error) throw error;
    return { count: data?.length };
  });
}

export async function testLiveStreams(): Promise<TestResult> {
  return timedTest("Live Streams Read", "database", async () => {
    const { data, error } = await supabase.from("live_streams").select("id").limit(5);
    if (error) throw error;
    return { count: data?.length };
  });
}

// ===== RAPID FIRE TEST =====

export async function testRapidFire(count: number = 20): Promise<TestResult> {
  return timedTest(`Rapid Fire (${count} queries)`, "performance", async () => {
    const promises = Array.from({ length: count }, (_, i) =>
      supabase.from("profiles").select("id").limit(1).then(({ error }) => {
        if (error) throw error;
        return i;
      })
    );
    const results = await Promise.allSettled(promises);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.filter((r) => r.status === "rejected").length;
    return { total: count, ok, fail };
  });
}

// ===== RUN ALL =====

export async function runFullStressTest(): Promise<TestResult[]> {
  logInfo("database", "Starting full stress test...");
  const results: TestResult[] = [];

  const tests = [
    testAuth,
    testDatabaseRead,
    testDatabaseWrite,
    testPostsCRUD,
    testRealtimeConnection,
    testStorageBuckets,
    testChatSystem,
    testNotifications,
    testProducts,
    testLiveStreams,
    () => testRapidFire(20),
  ];

  for (const test of tests) {
    results.push(await test());
  }

  logInfo("database", "Stress test complete", {
    total: results.length,
    passed: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  });

  return results;
}
