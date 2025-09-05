export type ReplayErrorType = 
  | 'DATA_FETCH_ERROR'
  | 'USER_INTERACTION_ERROR'
  | 'ANIMATION_ERROR'
  | 'SESSION_LOAD_ERROR'
  | 'DRIVER_DATA_ERROR'
  | 'TELEMETRY_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export interface ReplayError {
  type: ReplayErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  userFriendlyMessage: string;
  recoveryAction?: string;
}

export interface ErrorNotification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  duration?: number;
}

class ReplayErrorHandler {
  private static instance: ReplayErrorHandler;
  private errorHistory: ReplayError[] = [];
  private maxHistorySize = 50;
  private notificationCallbacks: Set<(notification: ErrorNotification) => void> = new Set();

  private constructor() {}

  static getInstance(): ReplayErrorHandler {
    if (!ReplayErrorHandler.instance) {
      ReplayErrorHandler.instance = new ReplayErrorHandler();
    }
    return ReplayErrorHandler.instance;
  }

  /**
   * 데이터 페치 에러 처리
   */
  static handleDataFetchError(error: Error, context?: Record<string, any>): ReplayError {
    const handler = ReplayErrorHandler.getInstance();
    
    const replayError: ReplayError = {
      type: 'DATA_FETCH_ERROR',
      message: `데이터 로딩 실패: ${error.message}`,
      originalError: error,
      context,
      timestamp: new Date(),
      userFriendlyMessage: '데이터를 불러오는데 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      recoveryAction: '새로고침 또는 다른 세션을 선택해보세요.'
    };

    handler.logError(replayError);
    ReplayErrorHandler.showUserFriendlyMessage(replayError.userFriendlyMessage, 'error');
    
    return replayError;
  }

  /**
   * 사용자 인터랙션 에러 처리
   */
  static handleUserInteractionError(error: Error, context?: Record<string, any>): ReplayError {
    const handler = ReplayErrorHandler.getInstance();
    
    const replayError: ReplayError = {
      type: 'USER_INTERACTION_ERROR',
      message: `사용자 액션 처리 실패: ${error.message}`,
      originalError: error,
      context,
      timestamp: new Date(),
      userFriendlyMessage: '요청을 처리할 수 없습니다. 다시 시도해주세요.',
      recoveryAction: '잠시 후 다시 클릭하거나 페이지를 새로고침하세요.'
    };

    handler.logError(replayError);
    ReplayErrorHandler.showUserFriendlyMessage(replayError.userFriendlyMessage, 'warning');
    
    return replayError;
  }

  /**
   * 세션 로딩 에러 처리
   */
  static handleSessionLoadError(error: Error, sessionInfo?: Record<string, any>): ReplayError {
    const handler = ReplayErrorHandler.getInstance();
    
    const replayError: ReplayError = {
      type: 'SESSION_LOAD_ERROR',
      message: `세션 로딩 실패: ${error.message}`,
      originalError: error,
      context: { sessionInfo },
      timestamp: new Date(),
      userFriendlyMessage: '선택한 세션을 불러올 수 없습니다.',
      recoveryAction: '다른 세션을 선택하거나 페이지를 새로고침하세요.'
    };

    handler.logError(replayError);
    ReplayErrorHandler.showUserFriendlyMessage(replayError.userFriendlyMessage, 'error');
    
    return replayError;
  }

  /**
   * 드라이버 데이터 에러 처리
   */
  static handleDriverDataError(error: Error, driverInfo?: Record<string, any>): ReplayError {
    const handler = ReplayErrorHandler.getInstance();
    
    const replayError: ReplayError = {
      type: 'DRIVER_DATA_ERROR',
      message: `드라이버 데이터 처리 실패: ${error.message}`,
      originalError: error,
      context: { driverInfo },
      timestamp: new Date(),
      userFriendlyMessage: '드라이버 정보를 불러오는데 문제가 발생했습니다.',
      recoveryAction: '다른 드라이버를 선택하거나 잠시 후 다시 시도하세요.'
    };

    handler.logError(replayError);
    ReplayErrorHandler.showUserFriendlyMessage(replayError.userFriendlyMessage, 'warning');
    
    return replayError;
  }

  /**
   * 텔레메트리 에러 처리
   */
  static handleTelemetryError(error: Error, context?: Record<string, any>): ReplayError {
    const handler = ReplayErrorHandler.getInstance();
    
    const replayError: ReplayError = {
      type: 'TELEMETRY_ERROR',
      message: `텔레메트리 데이터 처리 실패: ${error.message}`,
      originalError: error,
      context,
      timestamp: new Date(),
      userFriendlyMessage: '텔레메트리 데이터를 불러올 수 없습니다.',
      recoveryAction: '다른 드라이버를 선택하거나 재생을 다시 시작하세요.'
    };

    handler.logError(replayError);
    ReplayErrorHandler.showUserFriendlyMessage(replayError.userFriendlyMessage, 'warning');
    
    return replayError;
  }

  /**
   * 애니메이션 에러 처리
   */
  static handleAnimationError(error: Error, context?: Record<string, any>): ReplayError {
    const handler = ReplayErrorHandler.getInstance();
    
    const replayError: ReplayError = {
      type: 'ANIMATION_ERROR',
      message: `애니메이션 처리 실패: ${error.message}`,
      originalError: error,
      context,
      timestamp: new Date(),
      userFriendlyMessage: '애니메이션 처리 중 문제가 발생했습니다.',
      recoveryAction: '재생을 일시정지하고 다시 시작하세요.'
    };

    handler.logError(replayError);
    // 애니메이션 에러는 로그만 남기고 사용자에게는 알리지 않음 (너무 빈번할 수 있음)
    
    return replayError;
  }

  /**
   * 일반적인 에러 처리
   */
  static handleGenericError(error: Error, type: ReplayErrorType = 'UNKNOWN_ERROR', context?: Record<string, any>): ReplayError {
    const handler = ReplayErrorHandler.getInstance();
    
    const replayError: ReplayError = {
      type,
      message: error.message,
      originalError: error,
      context,
      timestamp: new Date(),
      userFriendlyMessage: '예상치 못한 오류가 발생했습니다.',
      recoveryAction: '페이지를 새로고침하거나 잠시 후 다시 시도하세요.'
    };

    handler.logError(replayError);
    ReplayErrorHandler.showUserFriendlyMessage(replayError.userFriendlyMessage, 'error');
    
    return replayError;
  }

  /**
   * 사용자 친화적 메시지 표시
   */
  static showUserFriendlyMessage(message: string, type: 'error' | 'warning' | 'info' = 'error'): void {
    const handler = ReplayErrorHandler.getInstance();
    
    const notification: ErrorNotification = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      duration: type === 'error' ? 8000 : 5000
    };

    // 콘솔에도 로깅
    const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [Replay Error] ${message}`);

    // 등록된 알림 콜백들에게 전달
    handler.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (err) {
        console.error('Error notification callback failed:', err);
      }
    });
  }

  /**
   * 에러 로깅
   */
  private logError(error: ReplayError): void {
    // 에러 히스토리에 추가
    this.errorHistory.unshift(error);
    
    // 히스토리 크기 제한
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }

    // 개발 환경에서 상세 로깅
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 [Replay Error] ${error.type}`);
      console.error('Message:', error.message);
      console.error('User Message:', error.userFriendlyMessage);
      console.error('Recovery Action:', error.recoveryAction);
      console.error('Context:', error.context);
      console.error('Original Error:', error.originalError);
      console.error('Timestamp:', error.timestamp);
      console.groupEnd();
    }
  }

  /**
   * 알림 콜백 등록
   */
  static onNotification(callback: (notification: ErrorNotification) => void): () => void {
    const handler = ReplayErrorHandler.getInstance();
    handler.notificationCallbacks.add(callback);
    
    // 구독 해제 함수 반환
    return () => {
      handler.notificationCallbacks.delete(callback);
    };
  }

  /**
   * 에러 히스토리 조회
   */
  static getErrorHistory(): ReplayError[] {
    const handler = ReplayErrorHandler.getInstance();
    return [...handler.errorHistory];
  }

  /**
   * 에러 히스토리 클리어
   */
  static clearErrorHistory(): void {
    const handler = ReplayErrorHandler.getInstance();
    handler.errorHistory = [];
  }

  /**
   * 네트워크 에러 감지 및 처리
   */
  static isNetworkError(error: Error): boolean {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('NETWORK_ERROR') ||
           error.name === 'NetworkError' ||
           error.name === 'TypeError' && error.message.includes('Failed to fetch');
  }

  /**
   * 타임아웃 에러 감지 및 처리  
   */
  static isTimeoutError(error: Error): boolean {
    return error.message.includes('timeout') || 
           error.message.includes('TIMEOUT') ||
           error.name === 'TimeoutError';
  }

  /**
   * 복구 가능한 에러인지 확인
   */
  static isRecoverableError(error: ReplayError): boolean {
    const recoverableTypes: ReplayErrorType[] = [
      'DATA_FETCH_ERROR',
      'USER_INTERACTION_ERROR', 
      'TELEMETRY_ERROR',
      'NETWORK_ERROR',
      'TIMEOUT_ERROR'
    ];
    
    return recoverableTypes.includes(error.type);
  }
}

export default ReplayErrorHandler;