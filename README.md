# 素材版权雷达 · AdSource Radar

本地广告素材版权筛查工作台。

## 启动

需要 Python 3.9 或更高版本。在项目目录运行：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python server.py
```

浏览器打开 [http://127.0.0.1:8765](http://127.0.0.1:8765)。端口可通过 `--port` 修改。服务只监听本机。

- **走一遍流程**：用「林宁」上传或打开示例素材，提交法务；从右上角切换到「周岚」核对证据、录入授权或给出结论。切换「王磊」可调整规则、来源字典、客户配置和查看日志。
- **上传实际素材**：支持选择或拖入 JPG / PNG 图片及文件夹，单张上限 20 MB 和 2400 万像素。详情可查看元数据、补框和单独重检，工作台可导出带中文表头的 CSV。
- **离线使用**：服务会读取 EXIF、XMP 和 IPTC 中可识别的版权字段。可把有权使用的参考图放到 `data/references/`，按图像结构（pHash）比较整图和元素。没有公开网络检索覆盖时，界面会提示人工核对。
- **本地数据**：`data/workspace.json` 保存工作区，`data/images/` 保存原图及预览，`data/proofs/` 保存授权凭证。备份整个 `data/` 目录即能保留完整工作记录。也可用 `--data-dir` 指定其他目录。使用一个标签页操作；另一个标签页写入后，旧标签页需要刷新。

## 云检索与元素识别（可选）

配置凭据后重启服务。云调用可能产生费用，筛查前请在「来源与客户」核对该使用方允许使用的引擎。Lumi Beauty 的素材在服务端限定为本地处理。服务发送去除元数据的图片或裁剪图。

- **腾讯混元 Hy4**：在启动服务的终端设置 `hy4_API_KEY`，使用腾讯云 TokenHub 的 API Key。默认调用 `hy4-flash`；可设 `RADAR_HY4_MODEL=hy4` 切换为正式版。启用后优先完成元素框选；Gemini 如已启用且有凭据，可在混元调用失败时补位。混元返回的可见文字作为复核线索展示。参见 [腾讯云 TokenHub 混元调用指南](https://cloud.tencent.com/document/product/1823/132252)。
- **Google Cloud Vision**：为 Google Cloud 项目启用 Vision API，设置 `GoogleVision_API_KEY`（也兼容 `GOOGLE_VISION_API_KEY`，两者同时设置时优先用前者）。服务可读取物体、人脸、Logo 和图库相关 OCR 文字，并逐元素调用 Web Detection。也可以使用下方的 ADC 配置代替 API 密钥。参见 [Vision API：images.annotate](https://docs.cloud.google.com/vision/docs/reference/rest/v1/images/annotate)。
- **Vertex AI Gemini**：安装 `requirements-cloud.txt`，配置应用默认凭据（ADC），设置 `RADAR_GOOGLE_ADC=1`、`GOOGLE_CLOUD_PROJECT`、`RADAR_GEMINI_MODEL`（项目内可用的 Gemini 模型 ID）。`RADAR_GOOGLE_LOCATION` 默认是 `global`。服务融合 Gemini 语义框和 Vision 检测框。参见 [Vertex AI：generateContent](https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.publishers.models/generateContent)。
- **本机人脸检测与背景补全**：如有需要，安装 `requirements-vision-local.txt` 后重启。纯本地模式下可检测正面人脸；有前景框时会生成补全背景并参与检索。

## 当前范围

- 示例素材和授权带有「示例」标签；示例授权不会改变实际素材的结果。
- Google 返回的是候选来源和匹配分类。实际素材记录来源 URL、采集时间、匹配类型和参考分；原型中的网页截图与可信时间戳仅用于示例。本地参考图库单独展示 pHash 分值，尚未接入云候选的 CLIP / ORB 复算。
- 本地身份切换用于体验工作流，供同一台电脑使用。飞书登录和通知、百度识图、字体识别及自动保留期清理尚未接入。
- 这是一套风险筛查工具，素材上线前仍由法务给出结论。
