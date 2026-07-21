import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { mouseLoading } from "../../../utils/index.mjs";
import { getCenterHighlightBox } from "../../../utils/highlight-element.mjs";
import { deriveFrameState, shouldRenderCursor } from "./derive-frame-state.mjs";
import { getPlaybackViewport } from "./playback-layout.mjs";
import { resolvePointerLayout, resolveSpinnerLayout } from "./pointer-layout.mjs";
const POINTER_PHASE = 0.375;
const CROSSFADE_FRAMES = 10;
const StepsTimeline = ({ frameMap, autoZoom, frame, width: compWidth, height: compHeight, fps })=>{
    const { scriptFrames, imageWidth: baseImgW, imageHeight: baseImgH } = frameMap;
    const state = useMemo(()=>deriveFrameState(scriptFrames, frame, baseImgW, baseImgH, fps), [
        scriptFrames,
        frame,
        baseImgW,
        baseImgH,
        fps
    ]);
    if (!state.img) return null;
    const { img, imageWidth: imgW, imageHeight: imgH, prevImg, camera, prevCamera, insights, spinning: spinningPointer, spinningElapsedMs, currentPointerImg, pointerVisible, title, subTitle, frameInScript, imageChanged, pointerMoved, rawProgress } = state;
    const pT = autoZoom ? pointerMoved ? Math.min(rawProgress / POINTER_PHASE, 1) : rawProgress : 1;
    const cT = pointerMoved ? rawProgress <= POINTER_PHASE ? 0 : Math.min((rawProgress - POINTER_PHASE) / (1 - POINTER_PHASE), 1) : rawProgress;
    const pointerLeft = prevCamera.pointerLeft + (camera.pointerLeft - prevCamera.pointerLeft) * pT;
    const pointerTop = prevCamera.pointerTop + (camera.pointerTop - prevCamera.pointerTop) * pT;
    const cameraLeft = autoZoom ? prevCamera.left + (camera.left - prevCamera.left) * cT : 0;
    const cameraTop = autoZoom ? prevCamera.top + (camera.top - prevCamera.top) * cT : 0;
    const cameraWidth = autoZoom ? prevCamera.width + (camera.width - prevCamera.width) * cT : imgW;
    const { offsetX, offsetY, contentWidth, contentHeight } = getPlaybackViewport(compWidth, compHeight, imgW, imgH);
    const zoom = imgW / cameraWidth;
    const tx = contentWidth / imgW * -cameraLeft;
    const ty = contentHeight / imgH * -cameraTop;
    const transformStyle = `scale(${zoom}) translate(${tx}px, ${ty}px)`;
    const camH = imgH / imgW * cameraWidth;
    const ptrX = (pointerLeft - cameraLeft) / cameraWidth * contentWidth;
    const ptrY = (pointerTop - cameraTop) / camH * contentHeight;
    const showCursor = shouldRenderCursor(pointerVisible, camera, prevCamera, imgW, imgH);
    const pointerLayout = resolvePointerLayout(imgW);
    const spinnerLayout = resolveSpinnerLayout(pointerLayout);
    const resScale = pointerLayout.scale;
    const crossfadeAlpha = imageChanged ? Math.min(frameInScript / CROSSFADE_FRAMES, 1) : 1;
    const spinRotation = spinningPointer ? (Math.sin(spinningElapsedMs / 500 - Math.PI / 2) + 1) / 2 * Math.PI * 2 : 0;
    const renderInsightOverlays = ()=>{
        if (0 === insights.length) return null;
        return insights.map((insight, idx)=>{
            const overlays = [];
            if (insight.highlightElement) {
                const highlightBox = getCenterHighlightBox(insight.highlightElement);
                overlays.push(/*#__PURE__*/ jsx("div", {
                    style: {
                        position: 'absolute',
                        left: highlightBox.left,
                        top: highlightBox.top,
                        width: highlightBox.width,
                        height: highlightBox.height,
                        background: 'rgba(253, 89, 7, 0.4)',
                        border: `${2 * resScale}px solid #fd5907`,
                        boxShadow: `${2 * resScale}px ${2 * resScale}px ${+resScale}px rgba(51, 51, 51, 0.3)`,
                        opacity: insight.alpha,
                        pointerEvents: 'none'
                    }
                }, `highlight-${idx}`));
            }
            if (insight.searchArea) {
                const rect = insight.searchArea;
                overlays.push(/*#__PURE__*/ jsx("div", {
                    style: {
                        position: 'absolute',
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                        background: 'rgba(2, 131, 145, 0.4)',
                        border: `${2 * resScale}px solid #028391`,
                        boxShadow: `${2 * resScale}px ${2 * resScale}px ${+resScale}px rgba(51, 51, 51, 0.3)`,
                        opacity: insight.alpha,
                        pointerEvents: 'none'
                    }
                }, `search-${idx}`));
            }
            return overlays;
        });
    };
    const renderContentArea = (w, h)=>/*#__PURE__*/ jsxs("div", {
            style: {
                width: w,
                height: h,
                position: 'relative',
                overflow: 'hidden'
            },
            children: [
                imageChanged && prevImg && crossfadeAlpha < 1 && /*#__PURE__*/ jsx("div", {
                    style: {
                        position: 'absolute',
                        width: w,
                        height: h,
                        overflow: 'hidden',
                        opacity: 1 - crossfadeAlpha
                    },
                    children: /*#__PURE__*/ jsx("img", {
                        alt: "",
                        src: prevImg,
                        style: {
                            width: w,
                            height: h,
                            transformOrigin: '0 0',
                            transform: transformStyle
                        }
                    })
                }),
                /*#__PURE__*/ jsxs("div", {
                    style: {
                        position: 'absolute',
                        width: w,
                        height: h,
                        overflow: 'hidden',
                        opacity: imageChanged ? crossfadeAlpha : 1
                    },
                    children: [
                        /*#__PURE__*/ jsx("img", {
                            alt: "",
                            src: img,
                            style: {
                                width: w,
                                height: h,
                                transformOrigin: '0 0',
                                transform: transformStyle
                            }
                        }),
                        /*#__PURE__*/ jsx("div", {
                            style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: w,
                                height: h,
                                transformOrigin: '0 0',
                                transform: transformStyle,
                                pointerEvents: 'none'
                            },
                            children: renderInsightOverlays()
                        })
                    ]
                }),
                spinningPointer && /*#__PURE__*/ jsx("img", {
                    alt: "",
                    src: mouseLoading,
                    style: {
                        position: 'absolute',
                        left: ptrX - spinnerLayout.centerOffset,
                        top: ptrY - spinnerLayout.centerOffset,
                        width: spinnerLayout.size,
                        height: spinnerLayout.size,
                        transform: `rotate(${spinRotation}rad)`,
                        transformOrigin: 'center center',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                    }
                }),
                showCursor && !spinningPointer && /*#__PURE__*/ jsx("img", {
                    alt: "",
                    src: currentPointerImg,
                    style: {
                        position: 'absolute',
                        left: ptrX - pointerLayout.hotspotX,
                        top: ptrY - pointerLayout.hotspotY,
                        width: pointerLayout.width,
                        height: pointerLayout.height,
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                    }
                })
            ]
        });
    return /*#__PURE__*/ jsx("div", {
        style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000'
        },
        children: /*#__PURE__*/ jsx("div", {
            style: {
                position: 'absolute',
                left: offsetX,
                top: offsetY,
                width: contentWidth,
                height: contentHeight,
                overflow: 'hidden'
            },
            children: renderContentArea(contentWidth, contentHeight)
        })
    });
};
export { StepsTimeline };
