#!/usr/bin/env python3
"""Optional Linux hardware EGL/GLES smoke, independent of MCF runtime or user sessions."""
import ctypes as C
import os
import sys
os.environ.setdefault('EGL_PLATFORM','surfaceless')
E=C.CDLL('libEGL.so.1')
G=C.CDLL('libGLESv2.so.2')
p=C.c_void_p; n=C.c_int
E.eglGetDisplay.argtypes=[p]; E.eglGetDisplay.restype=p
E.eglInitialize.argtypes=[p,C.POINTER(n),C.POINTER(n)]; E.eglInitialize.restype=n
E.eglBindAPI.argtypes=[n]; E.eglBindAPI.restype=n
E.eglChooseConfig.argtypes=[p,C.POINTER(n),C.POINTER(p),n,C.POINTER(n)]; E.eglChooseConfig.restype=n
E.eglCreatePbufferSurface.argtypes=[p,p,C.POINTER(n)];E.eglCreatePbufferSurface.restype=p
E.eglCreateContext.argtypes=[p,p,p,C.POINTER(n)];E.eglCreateContext.restype=p
E.eglMakeCurrent.argtypes=[p,p,p,p];E.eglMakeCurrent.restype=n
E.eglTerminate.argtypes=[p];E.eglTerminate.restype=n
E.eglDestroyContext.argtypes=[p,p];E.eglDestroyContext.restype=n
E.eglDestroySurface.argtypes=[p,p];E.eglDestroySurface.restype=n
G.glGetString.argtypes=[n];G.glGetString.restype=C.c_char_p
G.glClearColor.argtypes=[C.c_float]*4;G.glClearColor.restype=None
G.glClear.argtypes=[C.c_uint];G.glClear.restype=None
G.glFinish.argtypes=[];G.glFinish.restype=None
G.glReadPixels.argtypes=[n,n,n,n,n,n,p];G.glReadPixels.restype=None
G.glGetError.argtypes=[];G.glGetError.restype=C.c_uint
def ok(v,msg):
    if not v:raise RuntimeError(msg)
d=E.eglGetDisplay(p())
ok(d,'eglGetDisplay')
major=n();minor=n()
ok(E.eglInitialize(d,C.byref(major),C.byref(minor)),'eglInitialize')
try:
    ok(E.eglBindAPI(0x30A0),'eglBindAPI GLES2')
    attrs=(n*15)(0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3033,1,0x3040,4,0x3038)
    cfg=p();num=n()
    ok(E.eglChooseConfig(d,attrs,C.byref(cfg),1,C.byref(num)) and num.value,'eglChooseConfig')
    surf_attrs=(n*5)(0x3057,64,0x3056,64,0x3038)
    surf=E.eglCreatePbufferSurface(d,cfg,surf_attrs)
    ok(surf,'eglCreatePbufferSurface')
    ctx_attrs=(n*3)(0x3098,2,0x3038)
    ctx=E.eglCreateContext(d,cfg,p(),ctx_attrs)
    ok(ctx,'eglCreateContext')
    try:
        ok(E.eglMakeCurrent(d,surf,surf,ctx),'eglMakeCurrent')
        vendor=(G.glGetString(0x1F00) or b'').decode(errors='replace')
        renderer=(G.glGetString(0x1F01) or b'').decode(errors='replace')
        version=(G.glGetString(0x1F02) or b'').decode(errors='replace')
        G.glClearColor(C.c_float(0.2),C.c_float(0.4),C.c_float(0.6),C.c_float(1))
        G.glClear(0x00004000)
        G.glFinish()
        pix=(C.c_ubyte*4)()
        G.glReadPixels(32,32,1,1,0x1908,0x1401,C.cast(pix,p))
        status=G.glGetError()
        print('EGL',f'{major.value}.{minor.value}')
        print('GL_VENDOR',vendor)
        print('GL_RENDERER',renderer)
        print('GL_VERSION',version)
        print('PIXEL_RGBA',list(pix))
        print('GL_ERROR',hex(status))
        ok(status==0,'GL error')
        ok(all(abs(pix[i]-expect)<=2 for i,expect in enumerate((51,102,153,255))),'render mismatch')
        ok(not any(token in renderer.lower() for token in ('llvmpipe','softpipe','swiftshader')), 'software fallback detected')
        print('GPU_HARDWARE_OFFSCREEN_SMOKE=PASS')
    finally:
        E.eglMakeCurrent(d,p(),p(),p())
        E.eglDestroyContext(d,ctx)
        E.eglDestroySurface(d,surf)
finally:
    E.eglTerminate(d)
