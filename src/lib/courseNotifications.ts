import { supabase } from "@/integrations/supabase/client";

interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export const sendCourseNotification = async (data: NotificationData) => {
  try {
    await supabase.from('notifications').insert({
      user_id: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      metadata: data.metadata,
      read: false,
    });
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, { body: data.message, icon: '/icon-192.png' });
    }
  } catch { /* ignore */ }
};

export const scheduleCoursReminders = async (userId: string) => {
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, course:course_id(title)')
    .eq('user_id', userId)
    .is('completed_at', null)
    .lt('progress', 100);
  enrollments?.forEach(async (e) => {
    const days = Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86400000);
    if (days >= 7) {
      await sendCourseNotification({
        user_id: userId,
        title: '📚 Continua il tuo corso',
        message: `Hai lasciato "${(e.course as { title: string })?.title}" al ${e.progress}%. Continua ora!`,
        type: 'course_reminder',
        metadata: { course_id: e.course_id },
      });
    }
  });
};

export const notifyCertificateReady = async (userId: string, courseTitle: string, certificateUrl: string) => {
  await sendCourseNotification({
    user_id: userId,
    title: '🏆 Certificato pronto!',
    message: `Il tuo certificato per "${courseTitle}" è pronto per il download`,
    type: 'certificate_ready',
    metadata: { certificate_url: certificateUrl },
  });
};
