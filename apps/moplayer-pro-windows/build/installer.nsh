; ============================================================================
;  MoPlayer PC — Native NSIS Installer (Light/Clean Theme)
; ============================================================================

; ---------- 1. Define Custom Text for Native Pages ----------

!macro customHeader
  ; Welcome Page Text
  !define MUI_WELCOMEPAGE_TITLE_3DBOTTOMLINE " "
  !define MUI_WELCOMEPAGE_TITLE "Welcome to MoPlayer PC"
  !define MUI_WELCOMEPAGE_TEXT "Your premium media home on PC.$\r$\n$\r$\nInstall the desktop edition with the fast navigation and private source handoff."
  
  ; Finish Page Text
  !define MUI_FINISHPAGE_TITLE "MoPlayer PC is ready"
  !define MUI_FINISHPAGE_TITLE_3DBOTTOMLINE " "
  !define MUI_FINISHPAGE_TEXT "Open the app, pair your PC from moalfarras.space, and start watching with your own source."
!macroend

; ---------- 2. Inject Native Pages ----------

!macro customWelcomePage
  !insertMacro MUI_PAGE_WELCOME
!macroend

; We do not define customPageAfterChangeDir or customFinishPage.
; electron-builder will automatically insert the directory page (if enabled),
; the installation page, and the finish page.
; By creating build/license.txt, electron-builder will also automatically insert MUI_PAGE_LICENSE!

; ---------- 3. Process Management ----------

!macro customInit
  ; Kill running MoPlayer PC instances silently before installation begins
  nsExec::ExecToLog 'taskkill /F /IM "MoPlayer PC.exe" /T'
  Pop $0
  nsExec::ExecToLog 'taskkill /F /IM "MoPlayer Pro.exe" /T'
  Pop $0
  
  ; Also try killing the portable version if it's running
  nsExec::ExecToLog 'taskkill /F /IM "MoPlayer-PC-Portable.exe" /T'
  Pop $0
!macroend
