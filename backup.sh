#!/bin/bash

# MJ Gallery 自动备份脚本
# 用于备份MongoDB数据库和上传文件

# 配置变量
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mj-gallery"
PROJECT_DIR="/var/www/mj-gallery"
DB_NAME="midjourney-gallery"
RETENTION_DAYS=7
LOG_FILE="$BACKUP_DIR/backup.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# 检查必要的命令
check_dependencies() {
    local deps=("mongodump" "tar" "gzip")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep 命令未找到，请安装相关软件包"
            exit 1
        fi
    done
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "创建备份目录: $BACKUP_DIR"
    fi
}

# 检查磁盘空间
check_disk_space() {
    local available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_warning "磁盘空间不足，可用空间: ${available_space}KB，建议至少: ${required_space}KB"
    fi
}

# 备份MongoDB数据库
backup_database() {
    log_info "开始备份MongoDB数据库: $DB_NAME"
    
    local db_backup_dir="$BACKUP_DIR/db_$DATE"
    
    if mongodump --db "$DB_NAME" --out "$db_backup_dir" 2>/dev/null; then
        # 压缩数据库备份
        if tar -czf "$BACKUP_DIR/db_$DATE.tar.gz" -C "$BACKUP_DIR" "db_$DATE" 2>/dev/null; then
            rm -rf "$db_backup_dir"
            local backup_size=$(du -h "$BACKUP_DIR/db_$DATE.tar.gz" | cut -f1)
            log_success "数据库备份完成: db_$DATE.tar.gz ($backup_size)"
        else
            log_error "数据库备份压缩失败"
            return 1
        fi
    else
        log_error "数据库备份失败"
        return 1
    fi
}

# 备份上传文件
backup_uploads() {
    log_info "开始备份上传文件"
    
    local uploads_dir="$PROJECT_DIR/server/uploads"
    
    if [ -d "$uploads_dir" ]; then
        if tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR/server" "uploads" 2>/dev/null; then
            local backup_size=$(du -h "$BACKUP_DIR/uploads_$DATE.tar.gz" | cut -f1)
            log_success "上传文件备份完成: uploads_$DATE.tar.gz ($backup_size)"
        else
            log_error "上传文件备份失败"
            return 1
        fi
    else
        log_warning "上传文件目录不存在: $uploads_dir"
    fi
}

# 备份配置文件
backup_config() {
    log_info "开始备份配置文件"
    
    local config_backup_dir="$BACKUP_DIR/config_$DATE"
    mkdir -p "$config_backup_dir"
    
    # 备份环境配置文件
    if [ -f "$PROJECT_DIR/server/.env" ]; then
        cp "$PROJECT_DIR/server/.env" "$config_backup_dir/server.env"
    fi
    
    if [ -f "$PROJECT_DIR/client/.env" ]; then
        cp "$PROJECT_DIR/client/.env" "$config_backup_dir/client.env"
    fi
    
    # 备份PM2配置
    if [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
        cp "$PROJECT_DIR/ecosystem.config.js" "$config_backup_dir/"
    fi
    
    # 备份Nginx配置
    if [ -f "/etc/nginx/sites-available/mj-gallery" ]; then
        cp "/etc/nginx/sites-available/mj-gallery" "$config_backup_dir/nginx.conf"
    fi
    
    # 压缩配置文件
    if tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" -C "$BACKUP_DIR" "config_$DATE" 2>/dev/null; then
        rm -rf "$config_backup_dir"
        log_success "配置文件备份完成: config_$DATE.tar.gz"
    else
        log_error "配置文件备份失败"
        return 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理 $RETENTION_DAYS 天前的备份文件"
    
    local deleted_count=0
    
    # 删除旧的数据库备份
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log_info "删除旧备份: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "db_*.tar.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    # 删除旧的上传文件备份
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log_info "删除旧备份: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "uploads_*.tar.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    # 删除旧的配置文件备份
    while IFS= read -r -d '' file; do
        rm "$file"
        ((deleted_count++))
        log_info "删除旧备份: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "config_*.tar.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [ $deleted_count -gt 0 ]; then
        log_success "清理完成，删除了 $deleted_count 个旧备份文件"
    else
        log_info "没有需要清理的旧备份文件"
    fi
}

# 生成备份报告
generate_report() {
    log_info "生成备份报告"
    
    local report_file="$BACKUP_DIR/backup_report_$DATE.txt"
    
    {
        echo "MJ Gallery 备份报告"
        echo "==================="
        echo "备份时间: $(date)"
        echo "备份目录: $BACKUP_DIR"
        echo ""
        echo "备份文件列表:"
        ls -lh "$BACKUP_DIR"/*_$DATE.tar.gz 2>/dev/null || echo "没有找到备份文件"
        echo ""
        echo "磁盘使用情况:"
        df -h "$BACKUP_DIR"
        echo ""
        echo "备份目录总大小:"
        du -sh "$BACKUP_DIR"
    } > "$report_file"
    
    log_success "备份报告生成: $report_file"
}

# 发送通知（可选）
send_notification() {
    # 如果配置了邮件或其他通知方式，可以在这里发送备份完成通知
    # 例如：
    # echo "MJ Gallery 备份完成 - $DATE" | mail -s "备份通知" admin@coolai.ink
    log_info "备份通知功能未配置"
}

# 主函数
main() {
    log_info "开始执行 MJ Gallery 备份任务"
    log_info "备份时间戳: $DATE"
    
    # 检查依赖
    check_dependencies
    
    # 创建备份目录
    create_backup_dir
    
    # 检查磁盘空间
    check_disk_space
    
    # 执行备份
    local backup_success=true
    
    if ! backup_database; then
        backup_success=false
    fi
    
    if ! backup_uploads; then
        backup_success=false
    fi
    
    if ! backup_config; then
        backup_success=false
    fi
    
    # 清理旧备份
    cleanup_old_backups
    
    # 生成报告
    generate_report
    
    # 发送通知
    send_notification
    
    if [ "$backup_success" = true ]; then
        log_success "备份任务完成: $DATE"
        exit 0
    else
        log_error "备份任务部分失败: $DATE"
        exit 1
    fi
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi