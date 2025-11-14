-- Update the check constraint for episode_links platform column to include Terabox
-- First, we need to drop the old constraint and create a new one

ALTER TABLE public.episode_links
DROP CONSTRAINT IF EXISTS episode_links_platform_check;

ALTER TABLE public.episode_links
ADD CONSTRAINT episode_links_platform_check 
CHECK (platform IN ('WatchDT', 'Mega', 'Mediafire', 'Google Drive', 'Terabox', 'Direct Download', 'YouTube', 'Dailymotion', 'Vimeo', 'Netflix', 'Crunchyroll', 'HiDive'));
