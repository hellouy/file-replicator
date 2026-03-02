-- Cache table for difficult ccTLD lookup results
CREATE TABLE IF NOT EXISTS public.domain_lookup_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name TEXT NOT NULL UNIQUE,
  tld TEXT NOT NULL,
  lookup_source TEXT,
  payload JSONB NOT NULL,
  availability TEXT NOT NULL DEFAULT 'registered',
  failure_reason TEXT,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  hit_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_lookup_cache_tld ON public.domain_lookup_cache(tld);
CREATE INDEX IF NOT EXISTS idx_domain_lookup_cache_expires_at ON public.domain_lookup_cache(expires_at);

-- Retry queue for automatic compensation retry
CREATE TABLE IF NOT EXISTS public.domain_lookup_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name TEXT NOT NULL UNIQUE,
  tld TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 2,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_lookup_retry_status_time
  ON public.domain_lookup_retry_queue(status, next_retry_at);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.set_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_domain_lookup_cache_updated_at ON public.domain_lookup_cache;
CREATE TRIGGER trg_domain_lookup_cache_updated_at
BEFORE UPDATE ON public.domain_lookup_cache
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_domain_lookup_retry_queue_updated_at ON public.domain_lookup_retry_queue;
CREATE TRIGGER trg_domain_lookup_retry_queue_updated_at
BEFORE UPDATE ON public.domain_lookup_retry_queue
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp_updated_at();

-- Protect tables (backend/service-role only)
ALTER TABLE public.domain_lookup_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_lookup_retry_queue ENABLE ROW LEVEL SECURITY;