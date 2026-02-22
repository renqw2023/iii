# 图片文件重命名脚本
# 将ImageFlow文件夹中的文件重命名为与Hero.js代码中路径匹配的格式

$imageFlowPath = "D:\fenge\client\public\ImageFlow"
Set-Location $imageFlowPath

Write-Host "开始重命名ImageFlow文件夹中的图片文件..." -ForegroundColor Green

# 需要重命名的WEBP文件映射
$webpRenameMap = @{
    "52.webp" = "48 (4).webp"
    "54.webp" = "50 (1).webp"
    "55.webp" = "50 (2).webp"
    "56.webp" = "51 (1).webp"
    "57.webp" = "51 (2).webp"
}

# 需要创建的缺失文件（通过复制现有文件）
$missingFiles = @{
    "51 (3).webp" = "31 (3).webp"
    "52 (1).webp" = "32.webp"
}

Write-Host "`n=== 第一步：重命名现有文件 ===" -ForegroundColor Yellow

# 执行重命名操作
foreach ($oldName in $webpRenameMap.Keys) {
    $newName = $webpRenameMap[$oldName]
    if (Test-Path $oldName) {
        try {
            Rename-Item -Path $oldName -NewName $newName -Force
            Write-Host "✓ 重命名: $oldName -> $newName" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ 重命名失败: $oldName -> $newName. 错误: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "⚠ 文件不存在: $oldName" -ForegroundColor Yellow
    }
}

Write-Host "`n=== 第二步：创建缺失文件（通过复制） ===" -ForegroundColor Yellow

# 创建缺失的文件
foreach ($newFile in $missingFiles.Keys) {
    $sourceFile = $missingFiles[$newFile]
    if (Test-Path $sourceFile) {
        try {
            Copy-Item -Path $sourceFile -Destination $newFile -Force
            Write-Host "✓ 复制: $sourceFile -> $newFile" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ 复制失败: $sourceFile -> $newFile. 错误: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "⚠ 源文件不存在: $sourceFile" -ForegroundColor Yellow
    }
}

Write-Host "`n=== 第三步：验证文件完整性 ===" -ForegroundColor Yellow

# 验证Hero.js中引用的所有WEBP文件是否存在
$requiredWebpFiles = @(
    "01 (1).webp", "01 (2).webp", "01 (3).webp", "01 (4).webp",
    "02 (1).webp", "02 (2).webp", "02 (3).webp", "02 (4).webp",
    "03.webp", "04.webp", "05.webp", "06.webp",
    "07 (1).webp", "07 (2).webp", "07 (3).webp", "08.webp",
    "09.webp", "10.webp", "11 (1).webp", "11 (2).webp",
    "12.webp", "13.webp", "15.webp", "16 (1).webp", "16 (2).webp",
    "17 (1).webp", "17 (2).webp", "17 (3).webp", "17 (4).webp",
    "18.webp", "19 (1).webp", "19 (2).webp", "20 (1).webp",
    "20 (2).webp", "20 (3).webp", "21 (1).webp", "21 (2).webp",
    "22 (1).webp", "22 (2).webp", "23.webp", "24.webp", "25.webp",
    "26 (1).webp", "26 (2).webp", "27.webp", "28.webp", "29.webp",
    "30.webp", "31 (1).webp", "31 (2).webp", "31 (3).webp", "31 (4).webp",
    "32.webp", "33.webp", "34.webp", "35.webp", "36 (1).webp", "36 (2).webp",
    "37 (1).webp", "37 (2).webp", "38 (1).webp", "38 (2).webp", "39.webp",
    "40 (1).webp", "40 (2).webp", "40 (3).webp", "41 (1).webp", "41 (2).webp",
    "42 (1).webp", "42 (2).webp", "42 (3).webp", "42 (4).webp",
    "43 (1).webp", "43 (2).webp", "43 (3).webp", "44 (1).webp",
    "44 (2).webp", "44 (3).webp", "44 (4).webp", "45 (1).webp",
    "45 (2).webp", "45 (3).webp", "45 (4).webp", "46 (1).webp",
    "46 (2).webp", "46 (3).webp", "46 (4).webp", "47 (1).webp",
    "47 (2).webp", "47 (3).webp", "47 (4).webp", "48 (1).webp",
    "48 (2).webp", "48 (3).webp", "48 (4).webp", "49.webp",
    "50 (1).webp", "50 (2).webp", "51 (1).webp", "51 (2).webp", "51 (3).webp",
    "52 (1).webp", "52.webp", "54.webp", "55.webp", "56.webp", "57.webp"
)

$missingCount = 0
$existingCount = 0

foreach ($file in $requiredWebpFiles) {
    if (Test-Path $file) {
        $existingCount++
        Write-Host "✓ 存在: $file" -ForegroundColor Green
    }
    else {
        $missingCount++
        Write-Host "✗ 缺失: $file" -ForegroundColor Red
    }
}

Write-Host "`n=== 重命名完成统计 ===" -ForegroundColor Cyan
Write-Host "存在的文件: $existingCount" -ForegroundColor Green
Write-Host "缺失的文件: $missingCount" -ForegroundColor Red
Write-Host "总计需要的文件: $($requiredWebpFiles.Count)" -ForegroundColor White

if ($missingCount -eq 0) {
    Write-Host "`n🎉 所有WEBP文件都已准备就绪！" -ForegroundColor Green
}
else {
    Write-Host "`n⚠ 仍有 $missingCount 个文件缺失，需要手动处理" -ForegroundColor Yellow
}

Write-Host "`n脚本执行完成！" -ForegroundColor Cyan
Read-Host "按任意键退出"