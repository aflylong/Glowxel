import { createRouter, createWebHistory } from "vue-router";
import { getStoredAuthToken } from "@/utils/session.js";
import { getDeviceType } from "@/utils/device-detect.js";

const deviceModeViewLoaders = Object.freeze({
  CanvasEditor: {
    pc: () => import("@/views/CanvasEditor.vue"),
    mobile: () => import("@/views/mobile/CanvasEditor.vue"),
  },
  GifPlayer: {
    pc: () => import("@/views/GifPlayer.vue"),
    mobile: () => import("@/views/mobile/GifPlayer.vue"),
  },
  LedMatrix: {
    pc: () => import("@/views/LedMatrix.vue"),
    mobile: () => import("@/views/mobile/LedMatrix.vue"),
  },
  MazeMode: {
    pc: () => import("@/views/MazeMode.vue"),
    mobile: () => import("@/views/mobile/MazeMode.vue"),
  },
  SnakeMode: {
    pc: () => import("@/views/SnakeMode.vue"),
    mobile: () => import("@/views/mobile/SnakeMode.vue"),
  },
  TetrisSettings: {
    pc: () => import("@/views/TetrisSettings.vue"),
    mobile: () => import("@/views/mobile/TetrisSettings.vue"),
  },
  TetrisClockSettings: {
    pc: () => import("@/views/TetrisClockSettings.vue"),
    mobile: () => import("@/views/mobile/TetrisClockSettings.vue"),
  },
  PlanetScreensaver: {
    pc: () => import("@/views/PlanetScreensaver.vue"),
    mobile: () => import("@/views/mobile/PlanetScreensaver.vue"),
  },
  WaterWorld: {
    pc: () => import("@/views/WaterWorld.vue"),
    mobile: () => import("@/views/mobile/WaterWorld.vue"),
  },
  SpiritScreen: {
    pc: () => import("@/views/SpiritScreen.vue"),
    mobile: () => import("@/views/mobile/SpiritScreen.vue"),
  },
  AmbientEditor: {
    pc: () => import("@/views/AmbientEditorPc.vue"),
    mobile: () => import("@/views/mobile/AmbientEditor.vue"),
  },
  RickMortyPortal: {
    pc: () => import("@/views/RickMortyPortal.vue"),
    mobile: () => import("@/views/mobile/RickMortyPortal.vue"),
  },
  TerrariaClock: {
    pc: () => import("@/views/TerrariaClock.vue"),
    mobile: () => import("@/views/mobile/TerrariaClock.vue"),
  },
  AdventureIsland: {
    pc: () => import("@/views/AdventureIsland.vue"),
    mobile: () => import("@/views/mobile/AdventureIsland.vue"),
  },
  Kof97: {
    pc: () => import("@/views/Kof97.vue"),
    mobile: () => import("@/views/mobile/Kof97.vue"),
  },
  SpongeBobClock: {
    pc: () => import("@/views/mobile/SpongeBobClock.vue"),
    mobile: () => import("@/views/mobile/SpongeBobClock.vue"),
  },
  Clock: {
    pc: () => import("@/views/Clock.vue"),
    mobile: () => import("@/views/mobile/Clock.vue"),
  },
  AnimationClock: {
    pc: () => import("@/views/AnimationClock.vue"),
    mobile: () => import("@/views/mobile/AnimationClock.vue"),
  },
  ThemeClock: {
    pc: () => import("@/views/ThemeClock.vue"),
    mobile: () => import("@/views/mobile/ThemeClock.vue"),
  },
});

function resolveDeviceModeComponent(viewName) {
  return () => {
    if (getDeviceType() === "mobile") {
      return deviceModeViewLoaders[viewName].mobile();
    }
    return deviceModeViewLoaders[viewName].pc();
  };
}

function resolveResponsiveComponent(pcLoader, mobileLoader) {
  return () => {
    if (getDeviceType() === "mobile") {
      return mobileLoader();
    }
    return pcLoader();
  };
}

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Home.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/community",
    name: "Community",
    component: () => import("@/views/Community.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/templates",
    name: "Templates",
    component: () => import("@/views/Templates.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/challenges",
    name: "Challenges",
    component: () => import("@/views/Challenges.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/challenge/:id",
    name: "ChallengeDetail",
    component: () => import("@/views/ChallengeDetail.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/artwork/:id",
    name: "ArtworkDetail",
    component: () => import("@/views/ArtworkDetail.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/user/:id",
    name: "UserProfile",
    component: () => import("@/views/UserProfile.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/user/:id/followers",
    name: "UserFollowers",
    component: () => import("@/views/FollowList.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/user/:id/following",
    name: "UserFollowing",
    component: () => import("@/views/FollowList.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/design-system",
    name: "DesignSystem",
    component: () => import("@/views/DesignSystem.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/workspace",
    name: "Workspace",
    component: () => import("@/views/Workspace.vue"),
    meta: { shell: "app" },
  },
  {
    path: "/create",
    name: "Create",
    component: () => import("@/views/Create.vue"),
    meta: { shell: "app" },
  },
  {
    path: "/pattern-workbench",
    name: "PatternWorkbench",
    component: () => import("@/views/PatternWorkbench.vue"),
    meta: { shell: "app" },
  },
  {
    path: "/editor/:id?",
    name: "Editor",
    component: () => import("@/views/Editor.vue"),
    meta: { shell: "app" },
  },
  {
    path: "/gallery",
    name: "Gallery",
    component: () => import("@/views/Gallery.vue"),
    meta: { shell: "public" },
  },
  {
    path: "/overview/:id",
    name: "Overview",
    component: () => import("@/views/Overview.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/assist/:id",
    name: "Assist",
    component: () => import("@/views/Assist.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/publish-project/:id",
    name: "PublishProject",
    component: () => import("@/views/PublishProject.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/profile",
    name: "MyProfile",
    component: () => import("@/views/MyProfile.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/my-works",
    name: "MyWorks",
    component: () => import("@/views/MyWorks.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/my-favorites",
    name: "MyFavorites",
    component: () => import("@/views/MyFavorites.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/achievements",
    name: "Achievements",
    component: () => import("@/views/Achievements.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/cloud-sync",
    name: "CloudSync",
    component: () => import("@/views/CloudSync.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("@/views/Settings.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/settings/profile",
    name: "EditProfile",
    component: () => import("@/views/EditProfile.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/followers",
    name: "MyFollowers",
    component: () => import("@/views/FollowList.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/following",
    name: "MyFollowing",
    component: () => import("@/views/FollowList.vue"),
    meta: { shell: "app", auth: true },
  },
  {
    path: "/design-compare",
    name: "DesignCompare",
    component: () => import("@/views/DesignCompare.vue"),
    meta: { shell: "app" },
  },
  {
    path: "/device-control",
    name: "DeviceControl",
    component: () => import("@/views/mobile/DeviceControl.vue"),
    meta: { shell: "app" },
  },
  {
    path: "/device-flash",
    name: "DeviceFlash",
    component: () => import("@/views/mobile/DeviceFlash.vue"),
    meta: { shell: "app" },
  },
  {
    path: "/ble-config",
    name: "BleConfig",
    component: () => import("@/views/mobile/BleConfig.vue"),
    meta: { shell: "app" },
  },
  {
    path: "/device-params",
    name: "DeviceParams",
    component: resolveResponsiveComponent(
      () => import("@/views/DeviceParams.vue"),
      () => import("@/views/mobile/DeviceParams.vue"),
    ),
    meta: { shell: "app" },
  },
  {
    path: "/canvas-editor",
    name: "CanvasEditor",
    component: resolveDeviceModeComponent("CanvasEditor"),
    meta: { shell: "app" },
  },
  {
    path: "/gif-player",
    name: "GifPlayer",
    component: resolveDeviceModeComponent("GifPlayer"),
    meta: { shell: "app" },
  },
  {
    path: "/led-matrix",
    name: "LedMatrix",
    component: resolveDeviceModeComponent("LedMatrix"),
    meta: { shell: "app" },
  },
  {
    path: "/maze-mode",
    name: "MazeMode",
    component: resolveDeviceModeComponent("MazeMode"),
    meta: { shell: "app" },
  },
  {
    path: "/snake-mode",
    name: "SnakeMode",
    component: resolveDeviceModeComponent("SnakeMode"),
    meta: { shell: "app" },
  },
  {
    path: "/tetris-settings",
    name: "TetrisSettings",
    component: resolveDeviceModeComponent("TetrisSettings"),
    meta: { shell: "app" },
  },
  {
    path: "/tetris-clock-settings",
    name: "TetrisClockSettings",
    component: resolveDeviceModeComponent("TetrisClockSettings"),
    meta: { shell: "app" },
  },
  {
    path: "/planet-screensaver",
    name: "PlanetScreensaver",
    component: resolveDeviceModeComponent("PlanetScreensaver"),
    meta: { shell: "app" },
  },
  {
    path: "/water-world",
    name: "WaterWorld",
    component: resolveDeviceModeComponent("WaterWorld"),
    meta: { shell: "app" },
  },
  {
    path: "/spirit-screen",
    name: "SpiritScreen",
    component: resolveDeviceModeComponent("SpiritScreen"),
    meta: { shell: "app" },
  },
  {
    path: "/ambient-editor",
    name: "AmbientEditor",
    component: resolveDeviceModeComponent("AmbientEditor"),
    meta: { shell: "app" },
  },
  {
    path: "/rick-morty-portal",
    name: "RickMortyPortal",
    component: resolveDeviceModeComponent("RickMortyPortal"),
    meta: { shell: "app" },
  },
  {
    path: "/terraria-clock",
    name: "TerrariaClock",
    component: resolveDeviceModeComponent("TerrariaClock"),
    meta: { shell: "app" },
  },
  {
    path: "/adventure-island",
    name: "AdventureIsland",
    component: resolveDeviceModeComponent("AdventureIsland"),
    meta: { shell: "app" },
  },
  {
    path: "/kof97",
    name: "Kof97",
    component: resolveDeviceModeComponent("Kof97"),
    meta: { shell: "app" },
  },
  {
    path: "/spongebob-clock",
    name: "SpongeBobClock",
    component: resolveDeviceModeComponent("SpongeBobClock"),
    meta: { shell: "app" },
  },
  {
    path: "/clock",
    name: "Clock",
    component: resolveDeviceModeComponent("Clock"),
    meta: { shell: "app" },
  },
  {
    path: "/animation-clock",
    name: "AnimationClock",
    component: resolveDeviceModeComponent("AnimationClock"),
    meta: { shell: "app" },
  },
  {
    path: "/theme-clock",
    name: "ThemeClock",
    component: resolveDeviceModeComponent("ThemeClock"),
    meta: { shell: "app" },
  },
  {
    path: "/device-mode",
    name: "DeviceModePage",
    component: () => import("@/views/DeviceModePage.vue"),
    meta: { shell: "app" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

router.beforeEach((to) => {
  if (to.meta.auth && getStoredAuthToken().length === 0) {
    return { name: "Login", query: { redirect: to.fullPath } };
  }
});

router.afterEach((to) => {
  const isDevicePage =
    to.meta.shell === "app" &&
    (to.path.startsWith("/device-") ||
      to.path.startsWith("/maze-") ||
      to.path.startsWith("/snake-") ||
      to.path.startsWith("/tetris-") ||
      to.path.startsWith("/planet-") ||
      to.path.startsWith("/water-") ||
      to.path.startsWith("/spirit-") ||
      to.path.startsWith("/canvas-") ||
      to.path.startsWith("/gif-") ||
      to.path.startsWith("/led-") ||
      to.path.startsWith("/ble-") ||
      to.path.startsWith("/ambient-") ||
      to.path.startsWith("/rick-morty-") ||
      to.path.startsWith("/terraria-") ||
      to.path.startsWith("/adventure-") ||
      to.path.startsWith("/spongebob-") ||
      to.path === "/kof97" ||
      to.path === "/clock" ||
      to.path === "/animation-clock" ||
      to.path === "/theme-clock");

  if (typeof document !== "undefined") {
    document.body.classList.toggle("is-device-page", isDevicePage);
    document.body.classList.remove("is-device-single-page");
  }
});

export default router;
