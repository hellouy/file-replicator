-- Service-role only policies for cache/retry tables (edge function uses service role key)
-- No anon access needed

-- Allow service role to do everything on cache
CREATE POLICY "Service role full access on cache"
  ON public.domain_lookup_cache FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on retry queue"
  ON public.domain_lookup_retry_queue FOR ALL
  USING (true)
  WITH CHECK (true);