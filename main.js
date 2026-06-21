/**
 * Pot Translator 插件的主入口函数
 * @param {string} base64 - Pot 截取的图片，以纯 base64 字符串格式传入（不带 data:image 前缀）
 * @param {string} lang - Pot 传递的源语言参数（如 "auto", "en", "zh_cn" 等）
 * @param {object} options - Pot 提供的插件上下文，包含用户的配置项 (config) 和内置工具箱 (utils)
 */
async function recognize(base64, lang, options) {
    // 解构获取配置和工具
    const { config, utils } = options;
    const { http, tauriFetch } = utils;
    
    // 获取并处理 API 接口地址
    let endpoint = config.endpoint;
    if (!endpoint || endpoint.trim() === "") {
        // 默认使用地址
        endpoint = "https://open.bigmodel.cn/api/paas/v4/layout_parsing";
    }
    
    // 获取并处理模型名称
    let model = config.model;
    if (!model || model.trim() === "") {
        // 默认模型
        model = "glm-ocr";
    }

    // 将纯 base64 字符串包装为符合 URI 规范的格式，供大模型读取
    base64 = `data:image/png;base64,${base64}`;

    // 组装符合 OpenAI Vision API 标准的请求体
    let reqBody = {
        model: model,
        file: base64
    };

    // 发送网络请求
    if (http && http.fetch) {
        const { fetch, Body } = http;
        let res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": config.api_key
            },
            // 将对象转为 JSON 格式的请求体
            body: Body.json(reqBody)
        });

        if (res.ok) {
            let pages = res.data.layout_details;
            if (!pages || pages.length === 0) {
                throw JSON.stringify(res.data);
            }

            let texts = [];
            for (let page of pages) {
                if (!page) continue;
                for (let block of page) {
                    if (block.content && block.content.trim() !== "") {
                        texts.push(block.content);
                    }
                }
            }

            if (texts.length === 0) {
                throw JSON.stringify(res.data);
            }
            return texts.join("\n").trim();
        } else {
            throw JSON.stringify(res.data);
        }
    }
}
