import { Calendar, Clock, Sparkles, CheckCircle, X, Phone } from "lucide-react";
import { SmartReminder, useUpdateReminderStatus, useRescheduleReminder } from "@/hooks/useSmartReminders";
import { toast } from "sonner";
import { useState } from "react";

interface SmartReminderCardProps {
  reminder: SmartReminder;
}

export default function SmartReminderCard({ reminder }: SmartReminderCardProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const updateStatus = useUpdateReminderStatus();
  const reschedule = useRescheduleReminder();

  const getDaysOverdue = () => {
    const today = new Date();
    const suggestedDate = new Date(reminder.next_suggested_date);
    const diffTime = today.getTime() - suggestedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleComplete = async () => {
    try {
      await updateStatus.mutateAsync({ 
        reminderId: reminder.id, 
        status: 'completed',
        notes: 'Servizio completato dall\'utente'
      });
      toast.success("Promemoria completato!");
    } catch (error) {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleDismiss = async () => {
    try {
      await updateStatus.mutateAsync({ 
        reminderId: reminder.id, 
        status: 'dismissed',
        notes: 'Promemoria ignorato dall\'utente'
      });
      toast.success("Promemoria rimandato");
    } catch (error) {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleReschedule = async () => {
    if (!newDate) {
      toast.error("Seleziona una nuova data");
      return;
    }
    
    try {
      await reschedule.mutateAsync({ 
        reminderId: reminder.id, 
        newDate: newDate
      });
      toast.success("Promemoria riprogrammato!");
      setShowReschedule(false);
      setNewDate("");
    } catch (error) {
      toast.error("Errore nella riprogrammazione");
    }
  };

  const daysOverdue = getDaysOverdue();
  const isOverdue = daysOverdue > 0;
  const isUrgent = reminder.priority === 'high' || daysOverdue > 7;

  const priorityColors = {
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-orange-200 bg-orange-50',
    high: 'border-red-200 bg-red-50'
  };

  const priorityIcons = {
    low: '🔵',
    medium: '🟡', 
    high: '🔴'
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      isUrgent ? 'border-red-300 bg-red-50 shadow-md' : priorityColors[reminder.priority as keyof typeof priorityColors]
    }`}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{reminder.service_name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {priorityIcons[reminder.priority as keyof typeof priorityIcons]} {reminder.priority.toUpperCase()}
              {reminder.professionals && (
                <> • {reminder.professionals.business_name}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Date Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Ultimo servizio: {new Date(reminder.last_service_date).toLocaleDateString('it-IT')}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3 h-3" />
          <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-green-600'}>
            {isOverdue 
              ? `In ritardo di ${daysOverdue} giorni` 
              : `Suggerito per il ${new Date(reminder.next_suggested_date).toLocaleDateString('it-IT')}`
            }
          </span>
        </div>
      </div>

      {/* Frequenza */}
      <div className="mb-4 p-2 rounded-lg bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <strong>Frequenza consigliata:</strong> ogni {reminder.frequency_days} giorni
        </p>
        {reminder.notes && (
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Note:</strong> {reminder.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      {!showReschedule ? (
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`/booking/${reminder.professional_id}`, '_blank')}
            className="flex-1 py-2 px-3 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1"
          >
            📅 Prenota Ora
          </button>
          
          {reminder.professionals?.profiles && (
            <button
              className="px-3 py-2 rounded-lg bg-green-500 text-white text-xs flex items-center justify-center"
              onClick={() => window.open(`tel:${reminder.professionals?.profiles}`, '_self')}
            >
              <Phone className="w-3 h-3" />
            </button>
          )}
          
          <button
            onClick={handleComplete}
            className="px-3 py-2 rounded-lg bg-green-500 text-white text-xs flex items-center justify-center"
            title="Segna come completato"
          >
            <CheckCircle className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => setShowReschedule(true)}
            className="px-3 py-2 rounded-lg bg-blue-500 text-white text-xs"
            title="Riprogramma"
          >
            📅
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-3 py-2 rounded-lg bg-gray-500 text-white text-xs flex items-center justify-center"
            title="Ignora"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReschedule}
              className="flex-1 py-2 px-3 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold"
            >
              Conferma
            </button>
            <button
              onClick={() => {
                setShowReschedule(false);
                setNewDate("");
              }}
              className="px-3 py-2 rounded-lg bg-gray-500 text-white text-xs"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}