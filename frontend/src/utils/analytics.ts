// Google Analytics GA4 Integration

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Generate or retrieve persistent anonymous guest ID from localStorage
export function getGuestUserId(): string {
  if (typeof window === 'undefined') return 'guest_anonymous';
  try {
    let gid = localStorage.getItem('soniq_guest_id');
    if (!gid) {
      gid = `guest_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
      localStorage.setItem('soniq_guest_id', gid);
    }
    return gid;
  } catch {
    return 'guest_local';
  }
}

class GoogleAnalytics {
  private measurementId: string | null = null;
  private isInitialized = false;

  constructor() {
    const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as any);
    this.measurementId =
      (metaEnv.VITE_GA_MEASUREMENT_ID as string) ||
      (typeof window !== 'undefined' ? (window as any).__GA_MEASUREMENT_ID__ : null) ||
      null;
  }

  public init(userId?: string | null) {
    if (this.isInitialized || typeof window === 'undefined') return;

    const effectiveUserId = userId || getGuestUserId();

    if (!this.measurementId) {
      if (import.meta.env.DEV) {
        console.log(`[Analytics] Google Analytics in simulation mode (User/Guest ID: ${effectiveUserId})`);
      }
      return;
    }

    try {
      // 1. Inject gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      document.head.appendChild(script);

      // 2. Initialize dataLayer and gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer?.push(arguments);
      };

      window.gtag('js', new Date());
      window.gtag('config', this.measurementId, {
        send_page_view: false, // We manually track page/screen views
        user_id: effectiveUserId,
      });

      this.isInitialized = true;
      console.log(`[Analytics] Google Analytics initialized with ID: ${this.measurementId} (User/Guest ID: ${effectiveUserId})`);
    } catch (err) {
      console.warn('Failed to initialize Google Analytics:', err);
    }
  }

  public setUserId(userId: string | null) {
    const effectiveUserId = userId || getGuestUserId();
    if (this.measurementId && window.gtag) {
      window.gtag('set', 'user_properties', {
        user_id: effectiveUserId,
        is_guest: !userId,
      });
      window.gtag('config', this.measurementId, {
        user_id: effectiveUserId,
      });
    }
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Set user_id: ${effectiveUserId}`);
    }
  }

  public trackPageView(path: string, title?: string) {
    if (!this.measurementId || !window.gtag) {
      if (import.meta.env.DEV) console.log(`[GA Event] PageView: ${path}`);
      return;
    }

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  public trackQuizStart(artistName: string, totalQuestions: number) {
    this.sendEvent('quiz_start', {
      artist_name: artistName,
      total_questions: totalQuestions,
    });
  }

  public trackQuizComplete(
    artistName: string,
    score: number,
    accuracy: number,
    timeTakenSeconds: number
  ) {
    this.sendEvent('quiz_complete', {
      artist_name: artistName,
      score: score,
      accuracy: accuracy,
      time_taken_seconds: timeTakenSeconds,
    });
  }

  public trackQuestionAnswered(
    artistName: string,
    trackName: string,
    isCorrect: boolean,
    timeSpentSeconds: number
  ) {
    this.sendEvent('question_answered', {
      artist_name: artistName,
      track_name: trackName,
      is_correct: isCorrect,
      time_spent: timeSpentSeconds,
    });
  }

  public trackArtistSearch(query: string, resultsCount: number) {
    this.sendEvent('search', {
      search_term: query,
      results_count: resultsCount,
    });
  }

  public trackAuth(action: 'login' | 'register' | 'guest', role: string) {
    this.sendEvent('login', {
      method: action,
      user_role: role,
    });
  }

  private sendEvent(eventName: string, params: Record<string, any>) {
    const enrichedParams = {
      ...params,
      guest_user_id: getGuestUserId(),
    };

    if (!this.measurementId || !window.gtag) {
      if (import.meta.env.DEV) {
        console.log(`[GA Event] ${eventName}:`, enrichedParams);
      }
      return;
    }

    window.gtag('event', eventName, enrichedParams);
  }
}

export const analytics = new GoogleAnalytics();
export default analytics;
