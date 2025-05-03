<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import {computed, markRaw, ref, reactive, onMounted} from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import {
  LogOut, LockKeyhole, Eye, EyeOff, Github, BookOpenText,
  UserRoundPen, CircleHelp, SunMoon, Settings, Bell
} from '@vben/icons';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const passwordVisible = ref(false);
const activeTab = ref('account');
const showLoginOptions = ref(false);
const loginMode = ref('password'); // password, qrcode, sms
const rememberPassword = ref(true);
const loading = ref(false);
const showSuccessEffect = ref(false);
const showLoginForm = ref(true);
const loginAttempts = ref(0);
const securityLevel = ref(2); // 0-低, 1-中, 2-高

// 3D旋转效果状态
const card3dState = reactive({
  rotateX: 0,
  rotateY: 0,
  translateZ: 0
});

// 粒子动画
const particles = ref<Array<{
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
}>>([]);

// 生成随机粒子
function generateParticles() {
  const count = 50;
  const colors = ['#4F46E5', '#818CF8', '#3B82F6', '#2DD4BF', '#38BDF8'];
  const newParticles = [];

  for (let i = 0; i < count; i++) {
    newParticles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  particles.value = newParticles;
}

// 跟踪鼠标位置来实现3D效果
function handleMouseMove(event) {
  if (!showLoginForm.value) return;

  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const posX = event.clientX - centerX;
  const posY = event.clientY - centerY;

  // 计算旋转角度，最大20度
  const rotateX = (posY / (rect.height / 2)) * -10;
  const rotateY = (posX / (rect.width / 2)) * 10;

  card3dState.rotateX = rotateX;
  card3dState.rotateY = rotateY;
  card3dState.translateZ = 10;
}

function handleMouseLeave() {
  // 重置卡片旋转
  card3dState.rotateX = 0;
  card3dState.rotateY = 0;
  card3dState.translateZ = 0;
}

function switchLoginMode(mode) {
  loginMode.value = mode;
}

async function handleLogin() {
  loading.value = true;
  loginAttempts.value++;

  // 模拟登录过程
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 显示成功效果
  showLoginForm.value = false;
  showSuccessEffect.value = true;

  // 实际登录
  setTimeout(() => {
    authStore.authLogin({
      username: formApi.value?.getFieldValue('username'),
      password: formApi.value?.getFieldValue('password'),
      captcha: true
    });
  }, 1000);
}

const formApi = ref(null);

const getFormApi = (api) => {
  formApi.value = api;
};

const MOCK_USER_OPTIONS: BasicOption[] = [
  {
    label: 'Super Admin',
    value: 'vben',
  },
  {
    label: 'Admin',
    value: 'admin',
  },
  {
    label: 'User',
    value: 'jack',
  },
];

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenSelect',
      componentProps: {
        options: MOCK_USER_OPTIONS,
        placeholder: $t('authentication.selectAccount'),
        class: 'mb-6 rounded-xl transition-all duration-300 hover:shadow-lg login-input',
      },
      fieldName: 'selectAccount',
      label: $t('authentication.selectAccount'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.selectAccount') })
        .optional()
        .default('vben'),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
        class: 'mb-6 rounded-xl transition-all duration-300 hover:shadow-lg login-input',
        prefixIcon: markRaw(UserRoundPen),
      },
      dependencies: {
        trigger(values, form) {
          if (values.selectAccount) {
            const findUser = MOCK_USER_OPTIONS.find(
              (item) => item.value === values.selectAccount,
            );
            if (findUser) {
              form.setValues({
                password: '123456',
                username: findUser.value,
              });
            }
          }
        },
        triggerFields: ['selectAccount'],
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
        class: 'mb-6 rounded-xl transition-all duration-300 hover:shadow-lg login-input',
        prefixIcon: markRaw(LockKeyhole),
        toggleIcon: {
          on: markRaw(Eye),
          off: markRaw(EyeOff),
        },
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      componentProps: {
        class: 'mb-6 rounded-xl overflow-hidden backdrop-blur-sm captcha-slider',
      },
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});

onMounted(() => {
  generateParticles();
});
</script>

<template>
  <div class="login-container">
    <!-- 登录成功效果 -->
    <div v-if="showSuccessEffect" class="success-container">
      <div class="success-icon">
        <div class="success-circle"></div>
        <div class="success-tick"></div>
      </div>
      <h2 class="success-title">登录成功</h2>
      <p class="success-message">正在进入系统，请稍候...</p>
    </div>

    <!-- 登录表单 -->
    <div v-else class="animated-login">
      <!-- 背景粒子 -->
      <div class="particles-container">
        <div
          v-for="particle in particles"
          :key="particle.id"
          :style="{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDuration: `${particle.speed * 5}s`
          }"
          class="particle"
        ></div>
      </div>

      <!-- 3D卡片效果 -->
      <div
        class="login-card-container"
        @mouseleave="handleMouseLeave"
        @mousemove="handleMouseMove"
      >
        <div
          :style="{
            transform: `perspective(1000px) rotateX(${card3dState.rotateX}deg) rotateY(${card3dState.rotateY}deg) translateZ(${card3dState.translateZ}px)`
          }"
          class="login-card"
        >
          <!-- 登录模式切换 -->
          <div class="login-modes">
            <button
              :class="['mode-btn', {'active': loginMode === 'password'}]"
              @click="switchLoginMode('password')"
            >
              <LockKeyhole class="mode-icon"/>
              <span>密码登录</span>
            </button>
            <button
              :class="['mode-btn', {'active': loginMode === 'qrcode'}]"
              @click="switchLoginMode('qrcode')"
            >
              <BookOpenText class="mode-icon"/>
              <span>扫码登录</span>
            </button>
            <button
              :class="['mode-btn', {'active': loginMode === 'sms'}]"
              @click="switchLoginMode('sms')"
            >
              <Bell class="mode-icon"/>
              <span>短信登录</span>
            </button>
          </div>

          <!-- 密码登录表单 -->
          <div v-if="loginMode === 'password'" class="login-form-container">
            <AuthenticationLogin
              ref="getFormApi"
              :form-schema="formSchema"
              :loading="loading"
              :show-remember-me="false"
              :show-third-party-login="false"
              @submit="handleLogin"
            >
              <!-- 记住密码和忘记密码 -->
              <template #before-button>
                <div class="flex items-center justify-between mb-6">
                  <label class="custom-checkbox">
                    <input v-model="rememberPassword" type="checkbox"/>
                    <span class="checkbox-icon"></span>
                    <span class="checkbox-text">记住密码</span>
                  </label>
                  <a class="forget-link" href="#">忘记密码?</a>
                </div>
              </template>

              <!-- 自定义登录按钮 -->
              <template #button>
                <button
                  :class="{'loading': loading}"
                  class="login-button"
                  @click="handleLogin"
                >
                  <span class="button-text">{{ loading ? '登录中...' : '登 录' }}</span>
                  <span class="button-loader"></span>
                </button>
              </template>

              <!-- 第三方登录 -->
              <template #third-party-login>
                <div class="third-party">
                  <div class="divider">
                    <span>或使用以下方式登录</span>
                  </div>

                  <div class="social-buttons">
                    <button class="social-btn">
                      <Github class="size-5"/>
                    </button>
                    <button class="social-btn">
                      <BookOpenText class="size-5"/>
                    </button>
                    <button class="social-btn">
                      <SunMoon class="size-5"/>
                    </button>
                    <button class="social-btn">
                      <Settings class="size-5"/>
                    </button>
                  </div>
                </div>
              </template>

              <!-- 版权信息 -->
              <template #to-register>
                <div class="register-hint">
                  <p>还没有账号？<a class="register-link" href="#">立即注册</a></p>
                </div>

                <!-- 安全等级指示器 -->
                <div class="security-level">
                  <span class="security-text">安全登录</span>
                  <div class="level-indicators">
                    <div
                      v-for="i in 3"
                      :key="i"
                      :class="['level-dot', {'active': i <= securityLevel + 1}]"
                    ></div>
                  </div>
                </div>
              </template>
            </AuthenticationLogin>
          </div>

          <!-- 二维码登录 -->
          <div v-else-if="loginMode === 'qrcode'" class="qrcode-container">
            <div class="qrcode">
              <div class="qrcode-inner"></div>
              <div class="qrcode-scan-line"></div>
            </div>
            <p class="qrcode-tip">请使用App扫描二维码登录</p>
            <button class="mode-switch-btn" @click="switchLoginMode('password')">
              <span>返回密码登录</span>
            </button>
          </div>

          <!-- 短信登录 -->
          <div v-else-if="loginMode === 'sms'" class="sms-container">
            <div class="sms-form">
              <div class="sms-input-group">
                <label>手机号码</label>
                <div class="sms-input">
                  <UserRoundPen class="input-icon"/>
                  <input placeholder="请输入手机号码" type="text"/>
                </div>
              </div>

              <div class="sms-input-group">
                <label>验证码</label>
                <div class="sms-input with-button">
                  <LockKeyhole class="input-icon"/>
                  <input placeholder="请输入验证码" type="text"/>
                  <button class="sms-code-btn">获取验证码</button>
                </div>
              </div>

              <button class="login-button">
                <span class="button-text">登 录</span>
              </button>

              <button class="mode-switch-btn" @click="switchLoginMode('password')">
                <span>返回密码登录</span>
              </button>
            </div>
          </div>

          <!-- 卡片反光效果 -->
          <div class="card-glare"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
}

/* 粒子动画 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.particle {
  position: absolute;
  border-radius: 50%;
  animation: float linear infinite;
  z-index: 1;
  opacity: 0.5;
}

@keyframes float {
  0% {
    transform: translateY(100vh);
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  75% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(-20vh);
    opacity: 0;
  }
}

/* 登录卡片容器 */
.login-card-container {
  position: relative;
  z-index: 10;
  perspective: 1000px;
  width: 100%;
  max-width: 450px;
  margin: 0 auto;
}

/* 登录卡片 */
.login-card {
  position: relative;
  width: 100%;
  padding: 2rem;
  border-radius: 24px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  transform-style: preserve-3d;
}

/* 卡片反光效果 */
.card-glare {
  position: absolute;
  top: -100%;
  left: -100%;
  width: 300%;
  height: 300%;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0) 80%
  );
  transform: rotate(45deg);
  pointer-events: none;
  z-index: 1;
}

/* 登录模式切换 */
.login-modes {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  background: rgba(17, 24, 39, 0.5);
  border-radius: 16px;
  padding: 0.5rem;
  position: relative;
  z-index: 2;
}

.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  background: transparent;
  border: none;
  cursor: pointer;
}

.mode-btn.active {
  background: hsl(var(--primary));
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mode-icon {
  width: 16px;
  height: 16px;
}

/* 表单容器 */
.login-form-container {
  position: relative;
  z-index: 2;
}

/* 登录输入框样式 */
:deep(.login-input) {
  background: rgba(17, 24, 39, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

:deep(.login-input:focus-within) {
  border-color: hsl(var(--primary)) !important;
  box-shadow: 0 0 0 2px hsla(var(--primary) / 20%) !important;
}

:deep(.login-input input) {
  color: white !important;
}

:deep(.login-input input::placeholder) {
  color: rgba(255, 255, 255, 0.5) !important;
}

/* 验证码滑块 */
:deep(.captcha-slider) {
  background: rgba(17, 24, 39, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* 自定义复选框 */
.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.custom-checkbox input {
  display: none;
}

.checkbox-icon {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(17, 24, 39, 0.5);
  position: relative;
  transition: all 0.2s ease;
}

.custom-checkbox input:checked + .checkbox-icon {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.custom-checkbox input:checked + .checkbox-icon::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 6px;
  width: 5px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.forget-link {
  font-size: 0.875rem;
  color: hsl(var(--primary));
  text-decoration: none;
  transition: all 0.2s ease;
}

.forget-link:hover {
  text-decoration: underline;
  opacity: 0.9;
}

/* 登录按钮 */
.login-button {
  position: relative;
  width: 100%;
  padding: 0.875rem;
  border-radius: 12px;
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-foreground)));
  border: none;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px hsla(var(--primary) / 30%);
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px hsla(var(--primary) / 40%);
}

.login-button.loading .button-text {
  opacity: 0;
}

.login-button.loading .button-loader {
  opacity: 1;
}

.button-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  opacity: 0;
  transition: opacity 0.2s ease;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 第三方登录 */
.third-party {
  margin-top: 2rem;
}

.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 70px);
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  display: inline-block;
  padding: 0 10px;
  background: transparent;
  position: relative;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.social-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.social-btn:hover {
  transform: translateY(-3px);
  background: rgba(30, 41, 59, 0.8);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

/* 注册提示 */
.register-hint {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.register-link {
  color: hsl(var(--primary));
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.register-link:hover {
  text-decoration: underline;
}

/* 安全等级指示器 */
.security-level {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  gap: 0.75rem;
}

.security-text {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.level-indicators {
  display: flex;
  gap: 3px;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.level-dot.active:nth-child(1) {
  background: #10B981;
}

.level-dot.active:nth-child(2) {
  background: #3B82F6;
}

.level-dot.active:nth-child(3) {
  background: #6366F1;
}

/* 二维码登录 */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
}

.qrcode {
  width: 180px;
  height: 180px;
  background: white;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 1.5rem;
  position: relative;
  animation: pulse 2s ease-in-out infinite alternate;
}

.qrcode-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e293b 25%, transparent 25%) -10px 0,
  linear-gradient(225deg, #1e293b 25%, transparent 25%) -10px 0,
  linear-gradient(315deg, #1e293b 25%, transparent 25%),
  linear-gradient(45deg, #1e293b 25%, transparent 25%);
  background-size: 20px 20px;
  position: relative;
}

.qrcode-scan-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: hsla(var(--primary) / 70%);
  top: 50%;
  left: 0;
  box-shadow: 0 0 10px 5px hsla(var(--primary) / 40%);
  animation: scanLine 2s ease-in-out infinite;
}

@keyframes scanLine {
  0% {
    top: 10%;
  }
  50% {
    top: 90%;
  }
  100% {
    top: 10%;
  }
}

.qrcode-tip {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.mode-switch-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-switch-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 短信登录 */
.sms-container {
  padding: 1rem 0;
}

.sms-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sms-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sms-input-group label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.sms-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
}

.sms-input:focus-within {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px hsla(var(--primary) / 20%);
}

.input-icon {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.5);
}

.sms-input input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 0.875rem;
}

.sms-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.sms-input.with-button {
  padding-right: 0.5rem;
}

.sms-code-btn {
  background: hsla(var(--primary) / 90%);
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.sms-code-btn:hover {
  background: hsl(var(--primary));
}

/* 登录成功状态 */
.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease-out;
}

.success-icon {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 2rem;
}

.success-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid #10B981;
  box-sizing: border-box;
  animation: circle-appear 0.3s ease-in-out;
}

.success-tick {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 60px;
  border-right: 4px solid #10B981;
  border-bottom: 4px solid #10B981;
  transform: translate(-50%, -60%) rotate(45deg) scale(0);
  animation: tick-appear 0.3s ease-in-out forwards;
  animation-delay: 0.3s;
  transform-origin: center;
}

@keyframes circle-appear {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes tick-appear {
  from {
    transform: translate(-50%, -60%) rotate(45deg) scale(0);
  }
  to {
    transform: translate(-50%, -60%) rotate(45deg) scale(1);
  }
}

.success-title {
  font-size: 2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
  animation: fadeInUp 0.5s ease-out;
  animation-delay: 0.6s;
  animation-fill-mode: both;
}

.success-message {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  animation: fadeInUp 0.5s ease-out;
  animation-delay: 0.8s;
  animation-fill-mode: both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 hsla(var(--primary) / 40%);
  }
  70% {
    box-shadow: 0 0 0 10px hsla(var(--primary) / 0%);
  }
  100% {
    box-shadow: 0 0 0 0 hsla(var(--primary) / 0%);
  }
}
</style>
