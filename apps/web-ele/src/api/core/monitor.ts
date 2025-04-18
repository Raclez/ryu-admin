import {requestClient} from "#/api/request";

/**
 * 系统监控相关API
 */
export namespace MonitorApi {
  /**
   * 系统健康状态枚举
   */
  export enum HealthStatus {
    /** 健康状态 */
    HEALTHY = 'HEALTHY',
    /** 警告状态 */
    WARNING = 'WARNING',
    /** 危险状态 */
    DANGER = 'DANGER'
  }

  /**
   * 系统信息响应
   */
  export interface SystemInfo {
    /** 操作系统名称 */
    osName: string;
    /** 操作系统版本 */
    osVersion: string;
    /** 操作系统架构 */
    osArch: string;
    /** 可用处理器数量 */
    availableProcessors: number;
    /** JVM总内存(MB) */
    totalMemory: number;
    /** JVM可用内存(MB) */
    freeMemory: number;
    /** JVM已用内存(MB) */
    usedMemory: number;
    /** JVM最大内存(MB) */
    maxMemory: number;
    /** 内存使用率(%) */
    memoryUsage: number;
    /** JVM启动时间 */
    startTime: string;
    /** JVM运行时间(毫秒) */
    uptime: number;
    /** JVM名称 */
    jvmName: string;
    /** JVM版本 */
    jvmVersion: string;
    /** 系统健康状态 */
    healthStatus: HealthStatus;
  }

  /**
   * 线程信息
   */
  export interface ThreadInfo {
    /** 线程ID */
    threadId: number;
    /** 线程名称 */
    threadName: string;
    /** 线程状态 */
    threadState: string;
    /** 是否为守护线程 */
    daemon: boolean;
    /** 线程优先级 */
    priority: number;
    /** 线程组名称 */
    threadGroupName: string;
    /** 线程栈信息 */
    stackTrace?: string[];
    /** 锁定的监视器 */
    lockedMonitors?: string[];
    /** 锁定的同步器 */
    lockedSynchronizers?: string[];
    /** CPU时间(纳秒) */
    cpuTime?: number;
    /** 用户时间(纳秒) */
    userTime?: number;
  }

  /**
   * 线程统计信息
   */
  export interface ThreadStats {
    /** 总线程数 */
    totalThreadCount: number;
    /** 守护线程数 */
    daemonThreadCount: number;
    /** 峰值线程数 */
    peakThreadCount: number;
    /** 活动线程数 */
    activeThreadCount: number;
    /** 各状态线程数统计 */
    threadStateCount: Record<string, number>;
    /** 线程CPU使用率前N名 */
    topThreadsByCpu?: ThreadInfo[];
    /** 启动以来创建的线程总数 */
    totalStartedThreadCount: number;
    /** 死锁线程ID */
    deadlockedThreadIds?: number[];
  }

  /**
   * 线程分页请求参数
   */
  export interface ThreadPageParams {
    /** 页码 */
    page: number;
    /** 每页数量 */
    size: number;
    /** 搜索关键字 */
    keyword?: string;
  }

  /**
   * 线程分页响应
   */
  export interface ThreadPageResult {
    /** 总记录数 */
    total: number;
    /** 当前页数据 */
    records: ThreadInfo[];
  }
}

/**
 * 获取系统信息
 * @returns 系统基本信息，包含内存使用、JVM信息和健康状态
 */
export async function getSystemInfo(): Promise<MonitorApi.SystemInfo> {
  return requestClient.get('/ryu-user/monitor/info');
}

/**
 * 获取所有线程信息
 * @returns 所有线程的详细信息列表
 * @deprecated 请使用 getThreadsByPage 替代
 */
export async function getAllThreads(): Promise<MonitorApi.ThreadInfo[]> {
  return requestClient.get('/ryu-user/monitor/threads');
}

/**
 * 获取线程统计信息
 * @returns 线程状态统计和关键线程指标
 */
export async function getThreadStats(): Promise<MonitorApi.ThreadStats> {
  return requestClient.get('/ryu-user/monitor/thread-stats');
}

