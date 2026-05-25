from typing import Optional, Any, Dict
import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


# ── 业务异常基类 ─────────────────────────────────────────────
class AppException(Exception):
    error_code: str = "UNKNOWN_ERROR"
    http_status: int = 500
    default_message: str = "未知错误"

    def __init__(
        self,
        message: Optional[str] = None,
        user_action: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message or self.default_message
        self.user_action = user_action
        self.details = details or {}
        super().__init__(self.message)


# 验证 / 认证 / 业务 / 外部 四大类
class ValidationError(AppException):
    error_code = "VALIDATION_ERROR"
    http_status = 422
    default_message = "请求参数不合法"


class AuthError(AppException):
    error_code = "AUTH_ERROR"
    http_status = 401
    default_message = "认证失败"


class TokenExpiredError(AuthError):
    error_code = "AUTH_TOKEN_EXPIRED"
    default_message = "登录已过期，请重新登录"


class BusinessError(AppException):
    error_code = "BUSINESS_ERROR"
    http_status = 400
    default_message = "业务规则不满足"


class ResourceNotFoundError(BusinessError):
    error_code = "RESOURCE_NOT_FOUND"
    http_status = 404
    default_message = "资源不存在"


class ResourceConflictError(BusinessError):
    error_code = "RESOURCE_CONFLICT"
    http_status = 409
    default_message = "资源冲突"


class ExternalServiceError(AppException):
    error_code = "EXTERNAL_SERVICE_ERROR"
    http_status = 502
    default_message = "外部服务暂时不可用"


class SystemError(AppException):
    error_code = "SYSTEM_ERROR"
    http_status = 500
    default_message = "系统内部错误"


# ── 统一错误响应 ─────────────────────────────────────────────
def _error_response(
    *,
    error_code: str,
    message: str,
    http_status: int,
    user_action: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=http_status,
        content={
            "detail": message,                          # 与模块二契约兼容
            "success": False,
            "error_code": error_code,
            "message": message,
            "user_action": user_action,
            "details": details or {},
        },
    )


# ── 注册到 FastAPI 的处理器 ─────────────────────────────────
async def app_exception_handler(request: Request, exc: AppException):
    logger.warning(f"业务异常 {exc.error_code}: {exc.message} | {request.url.path}")
    return _error_response(
        error_code=exc.error_code,
        message=exc.message,
        http_status=exc.http_status,
        user_action=exc.user_action,
        details=exc.details,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """把 Pydantic 校验失败的字段整理给前端"""
    fields = []
    for err in exc.errors():
        fields.append({
            "field": ".".join(str(x) for x in err.get("loc", [])),
            "type": err.get("type"),
            "message": err.get("msg"),
        })
    logger.info(f"参数校验失败 {request.url.path}: {fields}")
    return _error_response(
        error_code="VALIDATION_ERROR",
        message="请求参数不合法",
        http_status=422,
        user_action="请检查表单字段后重新提交",
        details={"fields": fields},
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return _error_response(
        error_code=f"HTTP_{exc.status_code}",
        message=str(exc.detail),
        http_status=exc.status_code,
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"未捕获异常 {request.url.path}: {exc}")
    return _error_response(
        error_code="SYSTEM_INTERNAL_ERROR",
        message="服务器开了个小差，请稍后重试",
        http_status=500,
    )
