interface NotificationToastProps {
  message: string;
  show: boolean;
  icon?: "copy" | "success" | "error" | "info";
}

const NotificationToast = ({
  message,
  show,
  icon = "info",
}: NotificationToastProps) => {
  const iconClass = {
    copy: "fas fa-copy text-primary",
    success: "fas fa-check-circle text-success",
    error: "fas fa-exclamation-circle text-error",
    info: "fas fa-info-circle text-primary",
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-dark border border-gray-700 px-4 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center">
        <i className={`${iconClass[icon]} mr-2`}></i>
        <span className="text-sm text-white">{message}</span>
      </div>
    </div>
  );
};

export default NotificationToast;
