<template>
  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-section footer-brand">
          <BrandLogo variant="footer" :show-tagline="false" />
          <div class="footer-business">
            <h3 class="footer-title">涓氬姟绠€浠?</h3>
            <p class="footer-desc">
              鍏夋牸鍍忕礌宸ュ潑鏄竴涓笓娉ㄤ簬鍍忕礌鑹烘湳鍒涗綔涓庢櫤鑳界‖浠惰澶囪繛鎺ョ殑缁煎悎骞冲彴銆?              鎴戜滑鎻愪緵鍦ㄧ嚎鍍忕礌鐢荤紪杈戝櫒銆丟IF鍔ㄧ敾鍒朵綔銆佹椂閽熶富棰樺畾鍒剁瓑鍒涗綔宸ュ叿锛?              鏀寔鐢ㄦ埛閫氳繃WiFi杩炴帴ESP32鍍忕礌灞忚澶囷紝瀹炴椂棰勮鍜屽睍绀哄垱浣滃唴瀹广€?              骞冲彴闆嗘垚绀惧尯鍒嗕韩銆佷綔鍝佸睍绀恒€佹寫鎴樻椿鍔ㄧ瓑鍔熻兘锛屼负鍍忕礌鑹烘湳鐖卞ソ鑰呭拰鍒涘鎻愪緵涓€绔欏紡鍒涗綔涓庝氦娴佷綋楠屻€?            </p>
          </div>
        </div>

        <div class="footer-section footer-links">
          <h3 class="footer-title">蹇€熼摼鎺?</h3>
          <ul class="footer-nav">
            <li><router-link to="/">棣栭〉</router-link></li>
            <li><router-link to="/community">绀惧尯</router-link></li>
            <li><router-link to="/workspace">宸ヤ綔鍙?/router-link></li>
            <li><router-link to="/device-control">璁惧</router-link></li>
          </ul>
        </div>

        <div class="footer-section footer-contact">
          <h3 class="footer-title">鑱旂郴鎴戜滑</h3>
          <ul class="footer-nav">
            <li><span>鑱旂郴鐢佃瘽锛?76-7105-1481</span></li>
            <li><span>鑱旂郴閭锛?922733758@qq.com</span></li>
            <li><span>鍔炲叕鍦板潃锛氬箍涓滅渷娣卞湷甯傜綏婀栧尯绗嬪矖琛楅亾鐢板績绀惧尯瀹濆畨鍖楄矾3039鍙风瑡宀椾粨搴撳崄鍙峰簱5灞?05A-3B91</span></li>
            <li><a href="#">鐢ㄦ埛鍗忚</a></li>
            <li><a href="#">闅愮鏀跨瓥</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-copyright">
          <p>&copy; 2024-2026 鍏夋牸鍍忕礌宸ュ潑 鐗堟潈鎵€鏈?</p>
        </div>
        <div class="footer-beian">
          <p>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
              绮CP澶?026049160鍙?            </a>
          </p>
        </div>
      </div>
    </div>
  </footer>

  <button
    v-if="isBackToTopVisible"
    class="back-to-top"
    type="button"
    aria-label="杩斿洖椤堕儴"
    @click="scrollToTop"
  >
    <span class="back-to-top__arrow">鈫?</span>
  </button>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import BrandLogo from "@/components/BrandLogo.vue";

const isBackToTopVisible = ref(false);

const updateVisibility = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const documentHeight = document.documentElement.scrollHeight || 0;
  const isNearBottom = scrollTop + viewportHeight >= documentHeight - 160;
  isBackToTopVisible.value = isNearBottom && scrollTop > 240;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

onMounted(() => {
  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
  window.addEventListener("resize", updateVisibility);
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateVisibility);
  window.removeEventListener("resize", updateVisibility);
});
</script>

<style scoped>
.site-footer {
  background: #1a1a1a;
  color: #e0e0e0;
  padding: 60px 0 0;
  margin-top: 80px;
  border-top: 3px solid var(--nb-ink);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 48px;
  padding-bottom: 48px;
  border-bottom: 1px solid #333;
}

.footer-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-brand {
  gap: 20px;
}

.footer-desc {
  color: #999;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.footer-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px 0;
}

.footer-nav {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-nav span {
  color: #999;
  font-size: 14px;
}

.footer-nav a {
  color: #999;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.footer-nav a:hover {
  color: var(--nb-yellow);
}

.footer-business {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-copyright p {
  margin: 0;
}

.footer-beian {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.footer-beian p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-beian a {
  color: #666;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.footer-beian a:hover {
  color: #999;
}

.beian-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--nb-ink);
  background: #ffffff;
  border-radius: 0;
  box-shadow: var(--nb-shadow-card);
  color: var(--nb-ink);
  cursor: pointer;
  z-index: 1100;
}

.back-to-top:hover {
  background: var(--nb-yellow);
}

.back-to-top__arrow {
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

@media (max-width: 968px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }

  .footer-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .site-footer {
    padding: 40px 0 0;
    margin-top: 60px;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 32px;
    padding-bottom: 32px;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .footer-beian {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .back-to-top {
    right: 16px;
    bottom: 16px;
    width: 52px;
    height: 52px;
  }

  .back-to-top__arrow {
    font-size: 24px;
  }
}
</style>
