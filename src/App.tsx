import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/Auth/AuthForm';
import { CreatePost } from './components/Post/CreatePost';
import { PostList } from './components/Post/PostList';
import { ChatWindow } from './components/Chat/ChatWindow';
import { useThemeStore } from './store/themeStore';
import { Moon, Sun } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'feed' | 'chat'>('feed');
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useThemeStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <AuthForm type="login" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Social App</h1>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setView('feed')}
                className={`px-3 py-2 rounded ${
                  view === 'feed'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setView('chat')}
                className={`px-3 py-2 rounded ${
                  view === 'chat'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Chat
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'feed' ? (
          <div className="space-y-8">
            <CreatePost />
            <PostList />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Friends</h2>
              {/* Friend list would go here */}
            </div>
            <div className="md:col-span-3">
              {selectedFriend ? (
                <ChatWindow friendId={selectedFriend} />
              ) : (
                <div className="text-center py-8 text-gray-600 dark:text-gray-300">
                  Select a friend to start chatting
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;