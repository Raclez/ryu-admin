/**
 * 特殊处理从dashboard首页跳转到其他页面的问题
 */
import type {Router} from 'vue-router';

/**
 * 解决从首页跳转到其他页面时页面不显示的问题
 * 通过添加特殊的路由拦截来处理
 */
export function setupDashboardFix(router: Router) {
  // 记录是否来自首页
  let isFromDashboard = false;

  // 添加全局前置守卫
  router.beforeEach((to, from, next) => {
    // 检查是否从dashboard页面跳转
    if (from.path === '/dashboard') {
      isFromDashboard = true;
      // 如果是从dashboard跳转到其他页面，使用location.href直接跳转
      if (to.path !== '/dashboard') {
        console.log('检测到从dashboard页面跳转，使用直接跳转方式');
        // 使用window.location.href强制刷新页面
        window.location.href = to.fullPath;
        return; // 阻止Vue Router继续处理
      }
    }

    // 正常进行路由导航
    next();
  });

  // 添加导航后钩子
  router.afterEach(() => {
    // 重置标志
    isFromDashboard = false;
  });
}
