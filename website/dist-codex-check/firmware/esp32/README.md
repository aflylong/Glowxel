# Glowxel PixelBoard 网页烧录文件

这个目录会被官网静态托管为 `/firmware/esp32/`，供 `/device-flash` 页面里的 ESP Web Tools 使用。

注意：这里是 **USB Web Serial 网页烧录**，不是 WiFi 连接，也不是 WebSocket 控制设备。

## 为什么有多个 bin

ESP32 不是只把一个 `firmware.bin` 写进去就能完整启动。网页烧录需要按固定地址写入启动链、分区表、应用程序和数据分区。

| 文件 | 烧录地址 | 来源 | 作用 |
| --- | ---: | --- | --- |
| `bootloader.bin` | `0x1000` | `esp32-firmware/.pio/build/esp32dev/bootloader.bin` | ESP32 二级启动程序 |
| `partitions.bin` | `0x8000` | `esp32-firmware/.pio/build/esp32dev/partitions.bin` | 分区表，对应 `esp32-firmware/partitions.csv` |
| `boot_app0.bin` | `0xE000` | PlatformIO Arduino ESP32 framework package | Arduino ESP32 启动辅助数据 |
| `firmware.bin` | `0x10000` | `esp32-firmware/.pio/build/esp32dev/firmware.bin` | Glowxel 主程序 |
| `littlefs.bin` | `0x3F0000` | `pio.cmd run -t buildfs` 生成的 LittleFS 镜像 | 设备文件系统数据分区 |

`manifest.json` 里的 offset 必须和上表一致。当前分区表里数据分区是：

```csv
spiffs, data, spiffs, 0x3F0000, 0x10000,
```

虽然分区名叫 `spiffs`，但 `platformio.ini` 已配置：

```ini
board_build.filesystem = littlefs
```

所以发布文件命名为 `littlefs.bin`，并写入 `0x3F0000`。

## 生成发布文件

在仓库根目录执行：

```bash
cd esp32-firmware
.\pio.cmd run
.\pio.cmd run -t buildfs
.\scripts\prepare-web-flash-release.ps1
```

Windows PowerShell 里必须带 `.\` 才能执行当前目录下的 `pio.cmd`。

前两条 PIO 命令只负责生成，不会自动放到网站目录。生成位置是：

```text
esp32-firmware/.pio/build/esp32dev/bootloader.bin
esp32-firmware/.pio/build/esp32dev/partitions.bin
esp32-firmware/.pio/build/esp32dev/firmware.bin
esp32-firmware/.pio/build/esp32dev/littlefs.bin
```

第三条脚本负责把网页烧录需要的 5 个文件复制到本目录。`boot_app0.bin` 来自本机 PlatformIO 安装的 Arduino ESP32 framework package，脚本会按固定路径读取，不要用网上随便下载的同名文件替代。

## 发布到官网

脚本执行成功后，本目录会出现：

```text
website/public/firmware/esp32/bootloader.bin
website/public/firmware/esp32/partitions.bin
website/public/firmware/esp32/boot_app0.bin
website/public/firmware/esp32/firmware.bin
website/public/firmware/esp32/littlefs.bin
```

然后构建官网：

```bash
cd website
npm run build
```

发布前必须检查：

- `/firmware/esp32/manifest.json` 能访问。
- `/firmware/esp32/*.bin` 五个文件都能访问，不返回 404。
- `manifest.json` 里的 offset 没有被改错。
- 浏览器必须支持 Web Serial，推荐 Chrome / Edge 桌面版。

## 边界

- 平时本地开发烧录只需要 `cd esp32-firmware && pio.cmd run -t upload`，不需要手动处理这些 bin。
- 网页烧录页需要这些 bin，是因为浏览器要按 manifest 把每个分区写到指定 flash 地址。
- 不要把 `.pio/` 整个目录发布到网站。
- 这个目录下的 release bin 可以随 git 发布；`.gitignore` 只给 `website/public/firmware/esp32/*.bin` 开了例外。
- 不要提交临时构建产物。提交这里的 bin 前，要确认它们就是本次正式发布版本。
