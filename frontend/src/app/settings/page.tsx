"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Shield, Bell, Loader2, CheckCircle2, User, Save, Lock, Globe } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// The Inner Client Logic mapping Search Params seamlessly
function SettingsTabs() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update state if URL param changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createClientComponentClient();

  // Form States (Real Data Hydration)
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function fetchUser() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUserId(session.user.id);
            setEmail(session.user.email || "");
            setName(session.user.user_metadata?.full_name || "");
            
            // Optionally, fetch from the "users" table if metadata is blank
            if (!session.user.user_metadata?.name && !session.user.user_metadata?.full_name) {
                const { data: profileData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', session.user.id)
                    .single();
                if (profileData && profileData.name) {
                    setName(profileData.name);
                }
            }
        }
    }
    fetchUser();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    setIsSuccess(false);
    setErrorMsg("");

    try {
        if (activeTab === 'profile') {
            // Update Auth identity Metadata
            await supabase.auth.updateUser({
                data: { name: name, full_name: name }
            });
            // Update external DB profile schema organically mapped
            const { error: profileError } = await supabase
                .from('users')
                .update({ name: name })
                .eq('id', userId);

            if (profileError) throw profileError;
        }

        if (activeTab === 'security' && newPassword) {
            const { error: pwdError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (pwdError) throw pwdError;
            setNewPassword("");
            setPassword("");
        }

        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
        console.error("Save error:", err);
        setErrorMsg(err.message || "אירעה שגיאה בעדכון הפרופיל. אנא נסו שוב.");
        setTimeout(() => setErrorMsg(""), 5000);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row-reverse gap-8 font-sans">
      
      {/* Tab Menu - Right Sidebar logically mapped RTL */}
      <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
        <button 
          onClick={() => setActiveTab("profile")}
          className={`flex items-center flex-row-reverse gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
        >
          <User className="w-4 h-4" />
          הגדרות אישיות
        </button>
        <button 
          onClick={() => setActiveTab("security")}
          className={`flex items-center flex-row-reverse gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'security' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
        >
          <Shield className="w-4 h-4" />
          אבטחה וסיסמה
        </button>
        <button 
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center flex-row-reverse gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'preferences' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner' : 'text-slate-400 hover:bg-[#1e293b] hover:text-white border border-transparent'}`}
        >
          <Bell className="w-4 h-4" />
          העדפות למידה
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 bg-[#0f172a] rounded-3xl border border-[#1e293b] shadow-2xl p-6 md:p-10">
        <form onSubmit={handleSave} className="space-y-8 flex flex-col items-end w-full">
          
          {/* Header Title strictly bounded right aligned */}
          <div className="w-full text-right mb-6 border-b border-[#1e293b] pb-4" dir="rtl">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-start gap-3">
              {activeTab === 'profile' && <><Settings className="w-6 h-6 text-indigo-400" /> פרופיל אישי</>}
              {activeTab === 'security' && <><Shield className="w-6 h-6 text-rose-400" /> אבטחה וסיסמה</>}
              {activeTab === 'preferences' && <><Bell className="w-6 h-6 text-amber-400" /> העדפות מערכת</>}
            </h2>
            <p className="text-slate-400 font-medium text-sm mt-1">
              עדכנו את הפרטים המזהים שלכם בכדי לשפר את חווית סביבת העבודה.
            </p>
          </div>

          {activeTab === 'profile' && (
            <div className="w-full space-y-6 max-w-xl self-end">


              <div className="space-y-2 w-full text-right">
                <label className="text-sm font-bold text-slate-300">שם מלא</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  dir="rtl"
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-right"
                />
              </div>

              <div className="space-y-2 w-full text-right">
                <label className="text-sm font-bold text-slate-300">כתובת אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  dir="rtl"
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-slate-400 outline-none transition-all text-right font-mono cursor-not-allowed opacity-80"
                  disabled
                />
                <p className="text-xs text-rose-400 font-medium" dir="rtl">*לא ניתן לשנות כתובת אימייל במערכת הנוכחית</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="w-full space-y-6 max-w-xl self-end">
              <div className="space-y-2 w-full text-right">
                <label className="text-sm font-bold text-slate-300">סיסמה נוכחית</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="rtl"
                  placeholder="הקלד סיסמה פה..."
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-right"
                />
              </div>
              
              <div className="space-y-2 w-full text-right">
                <label className="text-sm font-bold text-slate-300">סיסמה חדשה</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  dir="rtl"
                  placeholder="הקלד סיסמה פה..."
                  className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-right"
                />
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start flex-row-reverse gap-3 mt-6">
                  <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200/80 font-medium leading-relaxed" dir="rtl">
                      מומלץ להשתמש בסיסמה חזקה המכילה אותיות, מספרים ותווים מיוחדים. המערכת תנתק אוטומטית התקנים במקרה של החלפת מפתח הפעלה מרכזי.
                  </p>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="w-full space-y-6 max-w-xl self-end">
              <div className="space-y-2 w-full text-right">
                <label className="text-sm font-bold text-slate-300 flex items-center justify-end gap-2 flex-row-reverse">
                    <Globe className="w-4 h-4 text-slate-500" /> שפת ממשק
                </label>
                <select dir="rtl" className="w-full bg-[#020617] border border-[#1e293b] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right appearance-none font-bold">
                    <option value="he">עברית (ברירת מחדל)</option>
                    <option value="en">English (US)</option>
                </select>
              </div>

              <div className="p-4 bg-[#020617] border border-[#1e293b] rounded-xl flex items-center justify-between flex-row-reverse mt-6 group hover:border-[#334155] transition-colors cursor-pointer">
                  <div className="text-right">
                      <h4 className="text-sm font-bold text-white mb-1" dir="rtl">התראות פוש</h4>
                      <p className="text-xs text-slate-400 font-medium" dir="rtl">קבלת עדכונים על תמלול שיעורים חדשים ופעילויות RAG</p>
                  </div>
                  <div className="w-10 h-6 bg-indigo-500 rounded-full relative shadow-inner">
                      <div className="absolute left-[calc(100%-22px)] top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all transform pointer-events-none"></div>
                  </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="w-full max-w-xl self-end pt-6 border-t border-[#1e293b] flex items-center justify-start flex-row-reverse">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 min-w-[140px] justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעדכן...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  נשמר!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  שמור שינויים
                </>
              )}
            </button>
            
            {errorMsg && (
                <span className="text-sm font-bold text-rose-400 animate-in fade-in mr-4" dir="rtl">
                    {errorMsg}
                </span>
            )}
            
            {isSuccess && (
                <span className="text-sm font-bold text-emerald-400 animate-in fade-in mr-4" dir="rtl">
                    החשבון עודכן בהצלחה!
                </span>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}

// The Root Server Page Wrapper
export default function SettingsPage() {
  return (
    <div className="bg-[#020617] text-white px-6 py-4 sm:px-10 sm:py-6 min-h-screen">
      <div className="max-w-5xl mx-auto mt-0 sm:mt-2">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Account Settings</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium text-lg">
              Manage your personal preferences, security protocols, and global notifications.
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="w-full flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>}>
            <SettingsTabs />
        </Suspense>

      </div>
    </div>
  );
}
