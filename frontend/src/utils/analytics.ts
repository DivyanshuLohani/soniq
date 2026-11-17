// Google Analytics GA4 Integration

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

class GoogleAnalytics {
  private measurementId: string | null = null;
  private isInitialized = false;

  constructor() {
    this.measurementId =
      (import.meta.env.VITE_GA_MEASUREMENT_ID as string) ||
      (window as any).__GA_MEASUREMENT_ID__ ||
      null;
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    if (!this.measurementId) {
      if (import.meta.env.DEV) {
        console.log('ℹ️ Google Analytics: VITE_GA_MEASUREMENT_ID not set. Analytics in simulation mode.');
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
      });

      this.isInitialized = true;
      console.log(`[Analytics] Google Analytics initialized with ID: ${this.measurementId}`);
    } catch (err) {
      console.warn('Failed to initialize Google Analytics:', err);
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
    if (!this.measurementId || !window.gtag) {
      if (import.meta.env.DEV) {
        console.log(`[GA Event] ${eventName}:`, params);
      }
      return;
    }

    window.gtag('event', eventName, params);
  }
}

export const analytics = new GoogleAnalytics();
export default analytics;
