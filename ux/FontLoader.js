class FontLoader {
    static supportedFontExtensions = ["ttf", "otf", "woff", "woff2"];
    static add(..._params) {
        if (!document.fonts || !FontFace || !Promise) {
            throw Error("WebfontLoaderPlugin relies heavily on Promises and the FontFace API and your browser doesn't support them.");
        }
        PIXI.LoaderResource.setExtensionLoadType("ttf", PIXI.LoaderResource.LOAD_TYPE.XHR);
        PIXI.LoaderResource.setExtensionXhrType("ttf", PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER);
        for (const ext of FontLoader.supportedFontExtensions) {
            PIXI.LoaderResource.setExtensionLoadType(ext, PIXI.LoaderResource.LOAD_TYPE.XHR);
            PIXI.LoaderResource.setExtensionXhrType(ext, PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER);
        }
    }
    static use(resource, next) {
        if (FontLoader.supportedFontExtensions.some((ext) => resource.extension.endsWith(ext))) {
            // this promise _shouldnt_ reject but just to be sure, finally;
            FontLoader.loadFromBuffer(resource).finally(() => next());
            return;
        }
        // fallback, it wasn't for us
        next();
    }
    /**
       * Overwriteable function in case you want to implement your own waiter
       * (e.g: FontFaceObserver)
       */
    static waitFont = async (fontDescriptor, testString, timeout) => {
        const fontStyle = fontDescriptor["font-style"] ?? "";
        const fontWeight = fontDescriptor["font-weight"] ?? "";
        const fontStretch = fontDescriptor["font-stretch"] ?? "";
        const fontFamily = fontDescriptor["font-family"];
        timeout = timeout || Infinity; // timeout=0 -> wait forever
        let now = new Date().getTime();
        const backThen = now;
        const mergedFontStyle = [fontStyle, fontWeight, fontStretch, "100px", fontFamily].join(" ");
        let loadedFonts = 0;
        do {
            loadedFonts = (await document.fonts.load(mergedFontStyle, testString)).length;
            if (loadedFonts > 0) {
                // Font loaded!
                return;
            }
            // sleep for a while or the browser can't load the fonts!
            await new Promise((resolve) => setTimeout(resolve, 16));
            now = new Date().getTime();
        } while (now - backThen < timeout);
        // We timed out! :(
        console.warn(`Error loading font! Your font ${fontDescriptor["font-family"]} timed out after ${timeout}ms`);
    };
    static loadFromBuffer(resource) {
        // If you don't specify a family name the resource name is used
        const fontFamily = resource.metadata?.font?.family ?? resource.name;
        // Add it to the document
        document.fonts.add(new FontFace(fontFamily, resource.data, resource.metadata?.font));
        // Add the style descriptor (I don't think nobody ever used this...)
        resource.styles = [{
                fontFamily: fontFamily.replace(/['|"]/gi, ""),
                fontStyle: resource.metadata?.font?.style,
                fontWeight: resource.metadata?.font?.weight
                // fontStretch: font.style["font-stretch"], //pixi doesn't know this
            }];
        // Usually this resolves instantly because we had the buffer in resource.data
        return FontLoader.waitFont({
            "font-family": fontFamily,
            "font-stretch": resource.metadata?.font?.stretch,
            "font-style": resource.metadata?.font?.style,
            "font-weight": resource.metadata?.font?.weight
        }, resource.metadata?.font?.testString, resource.metadata?.font?.timeout ?? resource.timeout);
    }
}
