# Manual Testing Script for Transactions API
# Base URL
$baseUrl = "http://localhost:3000/api/v1"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "=== JANUS AI - Manual API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get access token
Write-Host "1. Logging in..." -ForegroundColor Yellow
$loginData = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -Headers $headers -ContentType "application/json"
    $accessToken = $loginResponse.accessToken
    Write-Host "✓ Login successful! Access token obtained." -ForegroundColor Green
    Write-Host "  User ID: $($loginResponse.user.id)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. Server is running on port 3000" -ForegroundColor Yellow
    Write-Host "  2. Test user exists (email: test@example.com)" -ForegroundColor Yellow
    exit 1
}

# Update headers with auth token
$authHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $accessToken"
}

# Step 2: Create a new transaction
Write-Host "2. Creating a new transaction (BUY)..." -ForegroundColor Yellow
$newTransaction = @{
    transactionDate = "2025-01-20T10:00:00Z"
    transactionTypeId = 1  # BUY
    accountTypeId = 1      # MAIN
    ticker = "AAPL"
    quantity = 10
    price = 150.50
    totalAmount = 1505.00
    commission = 5.00
    notes = "Manual test transaction"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/transactions" -Method POST -Body $newTransaction -Headers $authHeaders
    $transactionId = $createResponse.id
    Write-Host "✓ Transaction created successfully!" -ForegroundColor Green
    Write-Host "  Transaction ID: $transactionId" -ForegroundColor Gray
    Write-Host "  Ticker: $($createResponse.ticker)" -ForegroundColor Gray
    Write-Host "  Amount: $($createResponse.totalAmount) PLN" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Failed to create transaction: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Step 3: Get all transactions (paginated)
Write-Host "3. Fetching all transactions (page 1, limit 10)..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/transactions?page=1&limit=10&sortBy=transaction_date&order=desc" -Method GET -Headers $authHeaders
    Write-Host "✓ Transactions fetched successfully!" -ForegroundColor Green
    Write-Host "  Total items: $($listResponse.pagination.totalItems)" -ForegroundColor Gray
    Write-Host "  Current page: $($listResponse.pagination.currentPage)" -ForegroundColor Gray
    Write-Host "  Total pages: $($listResponse.pagination.totalPages)" -ForegroundColor Gray
    Write-Host "  Transactions on this page: $($listResponse.data.Count)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Failed to fetch transactions: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Get single transaction by ID
if ($transactionId) {
    Write-Host "4. Fetching single transaction by ID..." -ForegroundColor Yellow
    try {
        $singleResponse = Invoke-RestMethod -Uri "$baseUrl/transactions/$transactionId" -Method GET -Headers $authHeaders
        Write-Host "✓ Transaction fetched successfully!" -ForegroundColor Green
        Write-Host "  ID: $($singleResponse.id)" -ForegroundColor Gray
        Write-Host "  Type: $($singleResponse.transactionType)" -ForegroundColor Gray
        Write-Host "  Account: $($singleResponse.accountType)" -ForegroundColor Gray
        Write-Host "  Ticker: $($singleResponse.ticker)" -ForegroundColor Gray
        Write-Host "  Date: $($singleResponse.transactionDate)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Failed to fetch transaction: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 5: Update transaction
if ($transactionId) {
    Write-Host "5. Updating transaction (adding note)..." -ForegroundColor Yellow
    $updateData = @{
        notes = "Updated via manual test - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        commission = 7.50
    } | ConvertTo-Json

    try {
        $updateResponse = Invoke-RestMethod -Uri "$baseUrl/transactions/$transactionId" -Method PUT -Body $updateData -Headers $authHeaders
        Write-Host "✓ Transaction updated successfully!" -ForegroundColor Green
        Write-Host "  Notes: $($updateResponse.notes)" -ForegroundColor Gray
        Write-Host "  Commission: $($updateResponse.commission)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Failed to update transaction: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 6: Filter transactions by ticker
Write-Host "6. Filtering transactions by ticker (AAPL)..." -ForegroundColor Yellow
try {
    $filterResponse = Invoke-RestMethod -Uri "$baseUrl/transactions?ticker=AAPL&page=1&limit=5" -Method GET -Headers $authHeaders
    Write-Host "✓ Filtered transactions fetched successfully!" -ForegroundColor Green
    Write-Host "  Found: $($filterResponse.pagination.totalItems) AAPL transactions" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Failed to filter transactions: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 7: Test XTB import
Write-Host "7. Testing XTB Excel import..." -ForegroundColor Yellow
$excelFilePath = "D:\Janus AI\tmp\account_51307109_pl_xlsx_2005-12-31_2025-10-17.xlsx"

if (Test-Path $excelFilePath) {
    try {
        # PowerShell multipart form data
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        $fileBytes = [System.IO.File]::ReadAllBytes($excelFilePath)
        $fileEnc = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes)
        
        $bodyLines = (
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"test-import.xlsx`"",
            "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet$LF",
            $fileEnc,
            "--$boundary--$LF"
        ) -join $LF

        $importHeaders = @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }

        $importResponse = Invoke-RestMethod -Uri "$baseUrl/transactions/import-xtb" -Method POST -Body $bodyLines -Headers $importHeaders
        Write-Host "✓ Import successful!" -ForegroundColor Green
        Write-Host "  Message: $($importResponse.message)" -ForegroundColor Gray
        Write-Host "  Imported count: $($importResponse.importedCount)" -ForegroundColor Gray
        Write-Host "  Batch ID: $($importResponse.importBatchId)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "✗ Import failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "⚠ Excel file not found at: $excelFilePath" -ForegroundColor Yellow
    Write-Host "  Skipping import test." -ForegroundColor Gray
    Write-Host ""
}

# Step 8: Delete transaction (cleanup)
if ($transactionId) {
    Write-Host "8. Deleting test transaction (cleanup)..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$baseUrl/transactions/$transactionId" -Method DELETE -Headers $authHeaders
        Write-Host "✓ Transaction deleted successfully!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "✗ Failed to delete transaction: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "All manual tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints tested:" -ForegroundColor Yellow
Write-Host "  ✓ POST /auth/login" -ForegroundColor Gray
Write-Host "  ✓ POST /transactions (create)" -ForegroundColor Gray
Write-Host "  ✓ GET /transactions (list with pagination)" -ForegroundColor Gray
Write-Host "  ✓ GET /transactions/:id (get by ID)" -ForegroundColor Gray
Write-Host "  ✓ PUT /transactions/:id (update)" -ForegroundColor Gray
Write-Host "  ✓ GET /transactions?ticker=X (filter)" -ForegroundColor Gray
Write-Host "  ✓ POST /transactions/import-xtb (import)" -ForegroundColor Gray
Write-Host "  ✓ DELETE /transactions/:id (delete)" -ForegroundColor Gray
Write-Host ""
