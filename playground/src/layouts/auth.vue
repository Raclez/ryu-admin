<script lang="ts" setup>
import {computed, ref, onMounted} from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';
import {BookOpenText, Sun, MoonStar, CircleHelp} from '@vben/icons';

import { $t } from '#/locales';

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const particles = ref<Array<{
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  rotation: number;
  rotationSpeed: number;
  type: number;
}>>([]);

// 生成随机粒子
function generateParticles() {
  const count = 20;
  const newParticles = [];

  for (let i = 0; i < count; i++) {
    newParticles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      type: Math.floor(Math.random() * 4)
    });
  }

  particles.value = newParticles;
}

onMounted(() => {
  generateParticles();
});
</script>

<template>
  <div class="auth-page-container">
    <div class="particles-container">
      <div
        v-for="particle in particles"
        :key="particle.id"
        :style="{
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          animationDuration: `${particle.speed * 10}s`,
          animationDelay: `${particle.delay}s`,
          transform: `rotate(${particle.rotation}deg)`,
          opacity: 0.4 + Math.random() * 0.4
        }"
        class="particle"
      >
        <MoonStar v-if="particle.type === 0" class="text-primary/40"/>
        <BookOpenText v-else-if="particle.type === 1" class="text-primary/40"/>
        <Sun v-else-if="particle.type === 2" class="text-secondary/40"/>
        <CircleHelp v-else class="text-primary/30"/>
      </div>
    </div>

    <AuthPageLayout
      :app-name="appName"
      :copyright="true"
      :logo="logo"
      :page-description="$t('authentication.pageDesc')"
      :page-title="$t('authentication.pageTitle')"
      :toolbar="true"
      :toolbar-list="['color', 'language', 'layout', 'theme']"
    >
      <!-- 自定义工具栏 -->
      <!-- <template #toolbar></template> -->
    </AuthPageLayout>
  </div>
</template>

<style scoped>
.auth-page-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.particles-container {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 24px;
  height: 24px;
  font-size: 24px;
  animation: float linear infinite;
  will-change: transform;
}

@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.2;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0.2;
  }
}

:deep(.login-background) {
  background: radial-gradient(circle at 50% 50%,
  hsl(var(--primary) / 30%) 0%,
  hsl(var(--secondary) / 20%) 40%,
  transparent 70%),
  radial-gradient(circle at 20% 70%,
    hsl(var(--secondary) / 20%) 0%,
    transparent 60%);
  filter: blur(100px);
  animation: backgroundPulse 15s ease-in-out infinite alternate;
  opacity: 0.7;
}

@keyframes backgroundPulse {
  0% {
    opacity: 0.5;
    transform: scale(0.95);
  }
  100% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

:deep(.logo) {
  animation: logoFloat 6s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
