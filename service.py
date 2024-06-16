import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import uvicorn
from threading import Thread

class AppServerSvc(win32serviceutil.ServiceFramework):
    _svc_name_ = "FastAPIService22"
    _svc_display_name_ = "FastAPI Service22"
    _svc_description_ = "A FastAPI application running as a Windows service."

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        socket.setdefaulttimeout(60)

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        self.main()

    def main(self):
        thread = Thread(target=self.run_uvicorn)
        thread.start()
        win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)

    def run_uvicorn(self):
        uvicorn.run("main:app", host="0.0.0.0", port=8000)

if __name__ == '__main__':
    win32serviceutil.HandleCommandLine(AppServerSvc)
