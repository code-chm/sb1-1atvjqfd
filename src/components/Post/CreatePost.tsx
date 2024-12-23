import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ImagePlus, Send } from 'lucide-react';

export function CreatePost() {
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    setLoading(true);
    try {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          image_url: publicUrl,
          caption,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (postError) throw postError;

      setImage(null);
      setCaption('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="mb-4">
        <label className="block mb-2">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <ImagePlus className="w-5 h-5" />
            <span>Choose an image</span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-gray-700 dark:file:text-gray-200"
          />
        </label>
      </div>

      <div className="mb-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500
            dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={!image || loading}
        className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 text-white rounded
          hover:bg-blue-700 transition duration-200 disabled:opacity-50 space-x-2"
      >
        <Send className="w-4 h-4" />
        <span>{loading ? 'Posting...' : 'Share Post'}</span>
      </button>
    </form>
  );
}