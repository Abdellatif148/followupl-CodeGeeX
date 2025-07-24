import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { profilesApi } from '../lib/database';
import { Bot } from 'lucide-react';

const TopBar = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profileData = await profilesApi.get(user.id);
        setProfile(profileData);
      }
    };
    fetchProfile();
  }, []);

  const handleAITalk = () => {
    alert('Initiating AI conversation...');
  };

  const isPro = profile?.plan === 'pro' || profile?.plan === 'super_pro';

  return (
    <div className="top-bar">
      {/* ...existing code... */}
      <div className="top-bar-actions">
        {/* ...existing code... */}
        {isPro && (
          <button className="ai-button flex items-center gap-2" onClick={handleAITalk} title="AI Assistant (Pro)">
            <Bot className="w-5 h-5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;