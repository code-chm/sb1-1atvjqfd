import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
  likes: {
    id: string;
  }[];
}

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url),
          likes (id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data || []);
      setLoading(false);
    };

    fetchPosts();

    // Subscribe to new posts
    const postsSubscription = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
    };
  }, []);

  const handleLike = async (postId: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: existingLike } = await supabase
      .from('likes')
      .select()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading posts...</div>;
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <img
                src={post.profiles.avatar_url || 'https://via.placeholder.com/40'}
                alt={post.profiles.username}
                className="w-10 h-10 rounded-full"
              />
              <span className="font-semibold dark:text-white">{post.profiles.username}</span>
            </div>
          </div>

          <img
            src={post.image_url}
            alt="Post"
            className="w-full object-cover max-h-96"
          />

          <div className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-red-500"
              >
                <Heart className={`w-6 h-6 ${post.likes.length > 0 ? 'fill-current text-red-500' : ''}`} />
                <span>{post.likes.length}</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                <MessageCircle className="w-6 h-6" />
              </button>
              <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-800 dark:text-gray-200 mb-2">{post.caption}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(post.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}