-- Check for recent posts
SELECT
  p.id,
  p.title,
  p.content,
  p.category,
  p.created_at,
  p.user_id,
  prof.name as author_name,
  prof.email as author_email
FROM public.posts p
LEFT JOIN public.profiles prof ON p.user_id = prof.id
ORDER BY p.created_at DESC
LIMIT 10;
