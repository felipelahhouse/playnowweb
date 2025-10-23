import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface MaintenanceNotification {
  enabled: boolean;
  message_en: string;
  message_pt: string;
  message_es: string;
  timestamp: number;
}

const SimpleMaintenanceMode: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [messageEN, setMessageEN] = useState('System under maintenance. We will be back soon!');
  const [messagePT, setMessagePT] = useState('Sistema em manutenção. Voltaremos em breve!');
  const [messageES, setMessageES] = useState('Sistema en mantenimiento. ¡Volveremos pronto!');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMaintenanceStatus();
  }, []);

  const loadMaintenanceStatus = async () => {
    try {
      const docRef = doc(db, 'system', 'maintenance_notification');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as MaintenanceNotification;
        setIsEnabled(data.enabled || false);
        setMessageEN(data.message_en || 'System under maintenance. We will be back soon!');
        setMessagePT(data.message_pt || 'Sistema em manutenção. Voltaremos em breve!');
        setMessageES(data.message_es || 'Sistema en mantenimiento. ¡Volveremos pronto!');
      }
    } catch (error) {
      console.error('Error loading maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: MaintenanceNotification = {
        enabled: isEnabled,
        message_en: messageEN,
        message_pt: messagePT,
        message_es: messageES,
        timestamp: Date.now()
      };

      await setDoc(doc(db, 'system', 'maintenance_notification'), data);
      alert('✅ Maintenance notification saved successfully!');
    } catch (error) {
      console.error('Error saving maintenance notification:', error);
      alert('❌ Error saving notification. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <h3 className="text-xl font-bold text-white">Maintenance Notification</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {isEnabled ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isEnabled ? 'bg-orange-500' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                isEnabled ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-6">
        Show a maintenance notification in the bottom right corner of the website.
        The message will be displayed in the user's selected language.
      </p>

      {/* Messages */}
      <div className="space-y-4 mb-6">
        {/* English */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🇬🇧 English Message
          </label>
          <textarea
            value={messageEN}
            onChange={(e) => setMessageEN(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows={2}
            placeholder="System under maintenance..."
          />
        </div>

        {/* Portuguese */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🇧🇷 Mensagem em Português
          </label>
          <textarea
            value={messagePT}
            onChange={(e) => setMessagePT(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows={2}
            placeholder="Sistema em manutenção..."
          />
        </div>

        {/* Spanish */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🇪🇸 Mensaje en Español
          </label>
          <textarea
            value={messageES}
            onChange={(e) => setMessageES(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows={2}
            placeholder="Sistema en mantenimiento..."
          />
        </div>
      </div>

      {/* Preview */}
      {isEnabled && (
        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p className="text-orange-400 text-sm font-medium mb-2">
            📱 Preview (as users will see):
          </p>
          <div className="bg-gray-800 rounded-lg p-3 border-l-4 border-orange-500">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium mb-1">⚠️ Maintenance Alert</p>
                <p className="text-gray-300 text-xs">{messagePT}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
};

export default SimpleMaintenanceMode;
