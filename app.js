
        // Hijaiyah letters (Arabic alphabet)
        const quranContent = [
            { letter: 'ا', class: 'hijaiyah-alif', meaning: 'Alif' },
            { letter: 'ب', class: 'hijaiyah-ba', meaning: 'Ba' },
            { letter: 'ت', class: 'hijaiyah-ta', meaning: 'Ta' },
            { letter: 'ث', class: 'hijaiyah-tsa', meaning: 'Tsa' },
            { letter: 'ج', class: 'hijaiyah-jim', meaning: 'Jim' },
            { letter: 'ح', class: 'hijaiyah-ha', meaning: 'Ha' },
            { letter: 'خ', class: 'hijaiyah-kha', meaning: 'Kha' },
            { letter: 'د', class: 'hijaiyah-dal', meaning: 'Dal' },
            { letter: 'ذ', class: 'hijaiyah-dzal', meaning: 'Dzal' },
            { letter: 'ر', class: 'hijaiyah-ra', meaning: 'Ra' },
            { letter: 'ز', class: 'hijaiyah-za', meaning: 'Za' },
            { letter: 'س', class: 'hijaiyah-sin', meaning: 'Sin' },
            { letter: 'ش', class: 'hijaiyah-syin', meaning: 'Syin' },
            { letter: 'ص', class: 'hijaiyah-shad', meaning: 'Shad' },
            { letter: 'ض', class: 'hijaiyah-dhad', meaning: 'Dhad' },
            { letter: 'ط', class: 'hijaiyah-tha', meaning: 'Tha' },
            { letter: 'ظ', class: 'hijaiyah-zha', meaning: 'Zha' },
            { letter: 'ع', class: 'hijaiyah-ain', meaning: 'Ain' },
            { letter: 'غ', class: 'hijaiyah-ghain', meaning: 'Ghain' },
            { letter: 'ف', class: 'hijaiyah-fa', meaning: 'Fa' },
            { letter: 'ق', class: 'hijaiyah-qaf', meaning: 'Qaf' },
            { letter: 'ك', class: 'hijaiyah-kaf', meaning: 'Kaf' },
            { letter: 'ل', class: 'hijaiyah-lam', meaning: 'Lam' },
            { letter: 'م', class: 'hijaiyah-mim', meaning: 'Mim' },
            { letter: 'ن', class: 'hijaiyah-nun', meaning: 'Nun' },
            { letter: 'و', class: 'hijaiyah-waw', meaning: 'Waw' },
            { letter: 'ه', class: 'hijaiyah-ha2', meaning: 'Ha' },
            { letter: 'ي', class: 'hijaiyah-ya', meaning: 'Ya' }
        ];

        // Game State
        let gameState = {
            board: Array(8).fill().map(() => Array(8).fill(0)), // Will be reinitialized in initializeGame()
            boardLetters: Array(8).fill().map(() => Array(8).fill(null)), // Will be reinitialized in initializeGame()
            score: 0,
            bestScore: parseInt(localStorage.getItem('quran-quest-best') || '0'),
            linesCleared: 0,
            bestCombo: 0,
            currentCombo: 0,
            blocksPlaced: 0,
            gameRunning: false,
            gridSize: 8
        };

        // Admin Settings
        let adminSettings = {
            difficulty: 'medium',
            gridSize: 8,
            pieceCount: 3,
            activeCustomLevel: '',
            customLevelIndex: 0,
            customLevelClearCount: 0,
            currentGameLevel: 1
        };

        // Custom Levels Storage
        let customLevels = {};

        // Load admin settings from localStorage
        function loadAdminSettings() {
            const saved = localStorage.getItem('quran-quest-admin-settings');
            if (saved) {
                adminSettings = { ...adminSettings, ...JSON.parse(saved) };
            }
            
            // Load custom levels
            const savedLevels = localStorage.getItem('quran-quest-custom-levels');
            if (savedLevels) {
                customLevels = JSON.parse(savedLevels);
            }
        }

        // Save custom levels to localStorage
        function saveCustomLevels() {
            localStorage.setItem('quran-quest-custom-levels', JSON.stringify(customLevels));
        }

        // Block shapes (Block Blast style)
        const blockShapes = [
            [[1]], // Single
            [[1,1]], [[1],[1]], // 2-blocks
            [[1,1,1]], [[1],[1],[1]], // 3-line
            [[1,1],[1,0]], [[1,1],[0,1]], [[1,0],[1,1]], [[0,1],[1,1]], // L-shapes
            [[1,1],[1,1]], // Square
            [[1,1,1],[1,0,0]], [[1,1,1],[0,0,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]], // L4
            [[1,1,1],[0,1,0]], [[1,0],[1,1],[1,0]], [[0,1,0],[1,1,1]], [[0,1],[1,1],[0,1]] // T-shapes
        ];

        let currentPieces = [];
        let selectedPiece = null;
        let selectedElement = null;

        // Initialize
        function init() {
            loadAdminSettings();
            loadCompletedLevels();
            updateBestScoreDisplay();
            setupPasswordInput();
            setupImportTxtListeners();
            // Register service worker for offline support
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('service-worker.js').catch(() => {});
            }
        }

        // Setup password input event listeners
        function setupPasswordInput() {
            const passwordInput = document.getElementById('admin-password-input');
            if (passwordInput) {
                passwordInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        checkAdminPassword();
                    }
                });
            }
            
            // Setup button event listeners
            const enterButton = document.querySelector('#admin-password-modal .play-button');
            const cancelButton = document.querySelector('#admin-password-modal .menu-button');
            
            if (enterButton) {
                enterButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    checkAdminPassword();
                });
            }
            
            if (cancelButton) {
                cancelButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    closeAdminPasswordModal();
                });
            }
        }

        function updateBestScoreDisplay() {
            document.getElementById('main-best-score').textContent = gameState.bestScore.toLocaleString();
            document.getElementById('game-best-score').textContent = gameState.bestScore.toLocaleString();
            document.getElementById('leaderboard-1').textContent = gameState.bestScore.toLocaleString();
            document.getElementById('main-current-level').textContent = adminSettings.currentGameLevel;
        }

        function startGame() {
            // Check if any custom levels exist
            if (Object.keys(customLevels).length === 0) {
                showCustomModal('⚠️ LEVEL BELUM DIBUAT!', 'Anda harus membuat level terlebih dahulu sebelum bisa bermain.\n\n📝 Silakan buka Admin Panel → Tab LEVEL untuk membuat level baru.');
                return;
            }
            
            // Find the lowest level number that exists
            const levelNumbers = Object.keys(customLevels).map(levelId => parseInt(customLevels[levelId].number)).sort((a, b) => a - b);
            const currentLevelNumber = adminSettings.currentGameLevel || 1;
            
            // Check if the current level exists
            const currentLevelId = `level-${currentLevelNumber}`;
            if (!customLevels[currentLevelId]) {
                showCustomModal(`⚠️ LEVEL ${currentLevelNumber} BELUM DIBUAT!`, `Anda harus membuat Level ${currentLevelNumber} terlebih dahulu.\n\n📝 Silakan buka Admin Panel → Tab LEVEL untuk membuat level ini.`);
                return;
            }
            
            // Check if user needs to enter password for current level
            if (currentLevelNumber > 1) {
                // Check if user has already unlocked this level
                const unlockedLevels = JSON.parse(localStorage.getItem('quran-quest-unlocked-levels') || '[]');
                if (!unlockedLevels.includes(currentLevelNumber)) {
                    // User needs to enter password for this level
                    // Store data for password verification
                    pendingLevelData = {
                        nextLevel: currentLevelNumber,
                        nextLevelId: currentLevelId,
                        type: 'direct_access'
                    };
                    showLevelPasswordModal(currentLevelNumber);
                    return;
                }
            }
            
            // Set the current level as active
            adminSettings.activeCustomLevel = currentLevelId;
            adminSettings.customLevelIndex = 0;
            adminSettings.customLevelClearCount = 0;
            
            document.getElementById('main-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            initializeGame();
        }

        // Start new level (with password) - called from "MAIN SEKARANG" button
        function startNewLevel() {
            // Use current level, not next level
            const currentLevel = adminSettings.currentGameLevel;
            const currentLevelId = `level-${currentLevel}`;
            
            // Check if level exists
            if (customLevels[currentLevelId]) {
                // Store level data for password verification
                pendingLevelData = {
                    nextLevel: currentLevel,
                    nextLevelId: currentLevelId,
                    type: 'main_menu' // Different type to distinguish from level progression
                };
                
                // Show password modal
                showLevelPasswordModal(currentLevel);
            } else {
                // Level doesn't exist, show guidance popup
                showCustomModal('📚 LEVEL BELUM DIBUAT', `Level ${currentLevel} belum dibuat.\n\nSilakan hubungi Ustadz/Ustadzah untuk menambahkan level berikutnya.`);
            }
        }

        function backToMenu() {
            document.getElementById('game-screen').classList.add('hidden');
            document.getElementById('main-screen').classList.remove('hidden');
            document.getElementById('game-over-modal').classList.add('hidden');
            // Reset game state
            gameState.gameRunning = false;
            
            // Update level maps button visibility
            updateLevelMapsButton();
            // Ensure main screen HUD reflects latest progression
            updateBestScoreDisplay();
        }

        function initializeGame() {
            const gridSize = adminSettings.gridSize;
            gameState = {
                board: Array(gridSize).fill().map(() => Array(gridSize).fill(0)),
                boardLetters: Array(gridSize).fill().map(() => Array(gridSize).fill(null)),
                score: 0,
                bestScore: parseInt(localStorage.getItem('quran-quest-best') || '0'),
                linesCleared: 0,
                bestCombo: 0,
                currentCombo: 0,
                blocksPlaced: 0,
                gameRunning: true,
                gridSize: gridSize
            };
            
            createGameBoard();
            addInitialBlocks();
            generateNewPieces();
            updateDisplay();
        }

        function addInitialBlocks() {
            const gridSize = gameState.gridSize;
            const cells = document.querySelectorAll('#game-board .grid-cell');
            
            // Generate initial blocks based on difficulty and grid size
            let blockDensity = 0.3; // Default medium difficulty
            if (adminSettings.difficulty === 'easy') blockDensity = 0.2;
            if (adminSettings.difficulty === 'hard') blockDensity = 0.4;
            
            // Create scattered pattern for initial blocks
            for (let row = 1; row < gridSize - 1; row++) {
                for (let col = 1; col < gridSize - 1; col++) {
                    // Skip center area for easier start
                    const centerStart = Math.floor(gridSize / 3);
                    const centerEnd = Math.floor(gridSize * 2 / 3);
                    if (row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd) {
                        continue;
                    }
                    
                    if (Math.random() < blockDensity) {
                        const randomLetter = quranContent[Math.floor(Math.random() * quranContent.length)];
                        gameState.board[row][col] = 1;
                        gameState.boardLetters[row][col] = randomLetter;
                        const index = row * gridSize + col;
                        cells[index].classList.add('filled', randomLetter.class);
                        cells[index].textContent = randomLetter.letter;
                    }
                }
            }
        }

        function createGameBoard() {
            const board = document.getElementById('game-board');
            const gridSize = gameState.gridSize;
            board.innerHTML = '';
            
            // Update CSS grid template
            board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
            // Expose grid size to CSS for responsive font sizing
            board.style.setProperty('--grid-size', gridSize);
            
            for (let i = 0; i < gridSize * gridSize; i++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.index = i;
                cell.dataset.row = Math.floor(i / gridSize);
                cell.dataset.col = i % gridSize;
                
                cell.addEventListener('dragover', e => e.preventDefault());
                cell.addEventListener('drop', handleDrop);
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    handleCellClick(e);
                });
                
                board.appendChild(cell);
            }
        }

        function generateNewPieces() {
            currentPieces = [];
            const pieceCount = adminSettings.pieceCount;
            
            for (let i = 0; i < pieceCount; i++) {
                const randomShape = blockShapes[Math.floor(Math.random() * blockShapes.length)];
                currentPieces.push({
                    shape: randomShape,
                    used: false,
                    id: i
                });
            }
            renderPieces();
        }

        function renderPieces() {
            const piecesArea = document.getElementById('pieces-area');
            piecesArea.innerHTML = '';
            
            // Update grid layout based on piece count
            const pieceCount = currentPieces.length;
            piecesArea.style.gridTemplateColumns = `repeat(${pieceCount}, 1fr)`;
            
            currentPieces.forEach((piece, index) => {
                const container = document.createElement('div');
                container.className = `piece-container ${piece.used ? 'used' : ''}`;
                container.dataset.pieceId = index;
                
                if (!piece.used) {
                    container.draggable = true;
                    container.addEventListener('dragstart', handleDragStart);
                    container.addEventListener('click', () => selectPiece(index, container));
                    container.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        selectPiece(index, container);
                    });
                }
                
                const grid = document.createElement('div');
                grid.className = 'piece-grid';
                grid.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 1fr)`;
                
                piece.shape.forEach(row => {
                    row.forEach(cell => {
                        const cellDiv = document.createElement('div');
                        cellDiv.className = cell ? 'piece-cell active' : 'piece-cell empty';
                        grid.appendChild(cellDiv);
                    });
                });
                
                container.appendChild(grid);
                piecesArea.appendChild(container);
            });
        }

        function selectPiece(pieceId, element) {
            // Cek apakah piece sudah digunakan
            if (element.classList.contains('used')) {
                // Piece sudah digunakan, tidak bisa di-select
                return;
            }
            
            // Prevent double selection
            if (selectedElement === element) {
                // Deselect if tapping the same piece
                selectedElement.classList.remove('selected');
                selectedElement = null;
                selectedPiece = null;
                clearClues();
                return;
            }
            
            if (selectedElement) {
                selectedElement.classList.remove('selected');
            }
            clearClues();

            selectedPiece = currentPieces[pieceId];
            selectedElement = element;
            element.classList.add('selected');
            
            // Enhanced haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
            
            // Smooth transition to show clues
            setTimeout(() => {
                showAllClues();
            }, 100);
        }

        function showAllClues() {
            if (!selectedPiece) return;

            const validPositions = [];
            const gridSize = gameState.gridSize;
            
            // Find all valid positions
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    if (canPlacePiece(row, col, selectedPiece.shape)) {
                        validPositions.push({row, col});
                    }
                }
            }
            
            // Show shape preview for all valid positions
            validPositions.forEach(pos => {
                showShapePreview(pos.row, pos.col, selectedPiece.shape);
                // Mark the top-left corner of each valid position as tap zone
                markTapZone(pos.row, pos.col);
            });
        }
        
        function showShapePreview(startRow, startCol, shape) {
            const cells = document.querySelectorAll('#game-board .grid-cell');
            const gridSize = gameState.gridSize;
            
            // Show the exact shape of the piece at this position
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] === 1) {
                        const targetRow = startRow + row;
                        const targetCol = startCol + col;
                        const index = targetRow * gridSize + targetCol;
                        
                        if (targetRow >= 0 && targetRow < gridSize && targetCol >= 0 && targetCol < gridSize) {
                            cells[index].classList.add('clue');
                        }
                    }
                }
            }
        }
        
        function markTapZone(row, col) {
            const cells = document.querySelectorAll('#game-board .grid-cell');
            const gridSize = gameState.gridSize;
            const index = row * gridSize + col;
            
            if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
                cells[index].classList.add('tap-zone');
                // Use standard dataset.row and dataset.col for consistency
                cells[index].dataset.tapRow = row;
                cells[index].dataset.tapCol = col;
            }
        }



        function clearClues() {
            document.querySelectorAll('#game-board .grid-cell').forEach(cell => {
                cell.classList.remove('clue', 'highlight', 'invalid', 'tap-zone');
                // Clear tap zone data
                delete cell.dataset.tapRow;
                delete cell.dataset.tapCol;
            });
        }



        function showPlacementPreview(startRow, startCol, shape) {
            clearPlacementPreview();
            const cells = document.querySelectorAll('#game-board .grid-cell');
            const gridSize = gameState.gridSize;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] === 1) {
                        const targetRow = startRow + row;
                        const targetCol = startCol + col;
                        const index = targetRow * gridSize + targetCol;
                        cells[index].classList.add('highlight');
                    }
                }
            }
        }

        function clearPlacementPreview() {
            document.querySelectorAll('#game-board .grid-cell').forEach(cell => {
                cell.classList.remove('highlight');
            });
        }

        function handleCellClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (selectedPiece && !selectedPiece.used) {
                let row, col;
                
                // If any tap-zones exist, require tapping on a tap-zone to reduce ambiguity across grid sizes
                const anyTapZones = document.querySelector('#game-board .tap-zone');
                const isTapZoneClick = e.target.classList && e.target.classList.contains('tap-zone');
                if (anyTapZones && !isTapZoneClick) {
                    // Provide soft feedback and ignore non-tap-zone clicks when guided clues are present
                    if (navigator.vibrate) {
                        navigator.vibrate(15);
                    }
                    return;
                }
                
                // Check if this is a tap zone (priority placement)
                if (e.target.classList.contains('tap-zone')) {
                    row = parseInt(e.target.dataset.tapRow);
                    col = parseInt(e.target.dataset.tapCol);
                } else {
                    // Regular cell click
                    row = parseInt(e.target.dataset.row);
                    col = parseInt(e.target.dataset.col);
                }
                
                // Validate position data
                if (isNaN(row) || isNaN(col) || 
                    row < 0 || row >= gameState.gridSize || 
                    col < 0 || col >= gameState.gridSize) {
                    console.warn('Invalid position data:', {row, col, gridSize: gameState.gridSize});
                    return;
                }
                
                // Try to place at the determined position
                if (canPlacePiece(row, col, selectedPiece.shape)) {
                    // Valid placement
                    e.target.classList.add('tap-feedback');
                    setTimeout(() => {
                        e.target.classList.remove('tap-feedback');
                        tryPlacePiece(row, col);
                    }, 150);
                    
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                } else {
                    // Invalid placement feedback
                    e.target.classList.add('tap-feedback');
                    setTimeout(() => {
                        e.target.classList.remove('tap-feedback');
                    }, 150);
                    
                    if (navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
                }
            }
        }

        function handleDragStart(e) {
            const pieceId = parseInt(e.target.dataset.pieceId);
            
            // Validate piece ID
            if (isNaN(pieceId) || pieceId < 0 || pieceId >= currentPieces.length) {
                console.warn('Invalid piece ID:', pieceId);
                e.preventDefault();
                return;
            }
            
            selectedPiece = currentPieces[pieceId];
        }

        function handleDrop(e) {
            e.preventDefault();
            if (selectedPiece && !selectedPiece.used) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                // Validate position data before placement
                if (isNaN(row) || isNaN(col) || 
                    row < 0 || row >= gameState.gridSize || 
                    col < 0 || col >= gameState.gridSize) {
                    console.warn('Invalid drop position:', {row, col, gridSize: gameState.gridSize});
                    return;
                }
                
                tryPlacePiece(row, col);
            }
        }

        function tryPlacePiece(row, col) {
            // Additional validation before placement
            if (!selectedPiece || selectedPiece.used) {
                console.warn('No valid piece selected or piece already used');
                return;
            }
            
            if (isNaN(row) || isNaN(col) || 
                row < 0 || row >= gameState.gridSize || 
                col < 0 || col >= gameState.gridSize) {
                console.warn('Invalid placement position:', {row, col, gridSize: gameState.gridSize});
                return;
            }
            
            if (canPlacePiece(row, col, selectedPiece.shape)) {
                // Success feedback
                if (navigator.vibrate) {
                    navigator.vibrate(100);
                }
                
                placePiece(row, col, selectedPiece.shape);
                selectedPiece.used = true;
                gameState.blocksPlaced++;
                
                if (selectedElement) {
                    selectedElement.classList.remove('selected');
                    selectedElement.classList.add('used');
                }
                selectedPiece = null;
                selectedElement = null;
                clearClues();
                
                // Check for completed lines
                setTimeout(() => {
                    checkCompletedLines();
                }, 100);
                
                // Generate new pieces if all are used
                if (currentPieces.every(piece => piece.used)) {
                    generateNewPieces();
                    renderPieces();
                }
                
                // Update display
                updateDisplay();
                
                // Check for game over
                if (isGameOver()) {
                    setTimeout(() => {
                        endGame();
                    }, 500);
                }
                
                // Clear placement preview
                clearPlacementPreview();
            } else {
                // Invalid placement feedback
                if (navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                }
                
                // Show invalid animation
                if (selectedElement) {
                    selectedElement.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        selectedElement.style.animation = '';
                    }, 500);
                }
            }
        }

        function canPlacePiece(startRow, startCol, shape) {
            const gridSize = gameState.gridSize;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const targetRow = startRow + row;
                        const targetCol = startCol + col;
                        
                        if (targetRow < 0 || targetRow >= gridSize || targetCol < 0 || targetCol >= gridSize) {
                            return false;
                        }
                        
                        if (gameState.board[targetRow][targetCol]) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function placePiece(startRow, startCol, shape) {
            const cells = document.querySelectorAll('#game-board .grid-cell');
            const gridSize = gameState.gridSize;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const targetRow = startRow + row;
                        const targetCol = startCol + col;
                        const index = targetRow * gridSize + targetCol;
                        
                        const randomLetter = quranContent[Math.floor(Math.random() * quranContent.length)];
                        gameState.board[targetRow][targetCol] = 1;
                        gameState.boardLetters[targetRow][targetCol] = randomLetter;
                        
                        cells[index].classList.add('filled', randomLetter.class);
                        cells[index].textContent = randomLetter.letter;
                    }
                }
            }
        }

        function checkCompletedLines() {
            let linesCleared = 0;
            const cells = document.querySelectorAll('#game-board .grid-cell');
            const linesToClear = [];
            const gridSize = gameState.gridSize;
            
            // Check rows
            for (let row = 0; row < gridSize; row++) {
                if (gameState.board[row].every(cell => cell === 1)) {
                    linesToClear.push({type: 'row', index: row});
                    linesCleared++;
                }
            }
            
            // Check columns
            for (let col = 0; col < gridSize; col++) {
                let columnFull = true;
                for (let row = 0; row < gridSize; row++) {
                    if (gameState.board[row][col] === 0) {
                        columnFull = false;
                        break;
                    }
                }
                if (columnFull) {
                    linesToClear.push({type: 'col', index: col});
                    linesCleared++;
                }
            }
            
            if (linesCleared > 0) {
                // Animate clearing
                linesToClear.forEach(line => {
                    if (line.type === 'row') {
                        for (let col = 0; col < gridSize; col++) {
                            const index = line.index * gridSize + col;
                            cells[index].classList.add('clearing');
                        }
                    } else {
                        for (let row = 0; row < gridSize; row++) {
                            const index = row * gridSize + line.index;
                            cells[index].classList.add('clearing');
                        }
                    }
                });
                
                setTimeout(() => {
                    linesToClear.forEach(line => {
                        if (line.type === 'row') {
                            for (let col = 0; col < gridSize; col++) {
                                const index = line.index * gridSize + col;
                                const cell = cells[index];
                                // Remove all quran classes
                                quranContent.forEach(letter => {
                                    cell.classList.remove(letter.class);
                                });
                                cell.classList.remove('filled', 'clearing');
                                cell.textContent = '';
                                gameState.board[line.index][col] = 0;
                                gameState.boardLetters[line.index][col] = null;
                            }
                        } else {
                            for (let row = 0; row < gridSize; row++) {
                                const index = row * gridSize + line.index;
                                const cell = cells[index];
                                // Remove all quran classes
                                quranContent.forEach(letter => {
                                    cell.classList.remove(letter.class);
                                });
                                cell.classList.remove('filled', 'clearing');
                                cell.textContent = '';
                                gameState.board[row][line.index] = 0;
                                gameState.boardLetters[row][line.index] = null;
                            }
                        }
                    });
                }, 600);
                
                // Calculate score
                gameState.currentCombo++;
                gameState.linesCleared += linesCleared;
                
                let points = 10;
                if (linesCleared >= 2) points = 30;
                if (linesCleared >= 3) points = 60;
                if (linesCleared >= 4) points = 100;
                
                points *= gameState.currentCombo;
                gameState.score += points;
                gameState.bestCombo = Math.max(gameState.bestCombo, gameState.currentCombo);
                
                showFloatingScore(points);
                if (gameState.currentCombo > 1) {
                    showComboIndicator(gameState.currentCombo);
                }
                
                // Show learning popup after clearing animation completes
                setTimeout(() => {
                    showLearningPopup();
                }, 800);
                
                if (gameState.score > gameState.bestScore) {
                    gameState.bestScore = gameState.score;
                    localStorage.setItem('quran-quest-best', gameState.bestScore.toString());
                    updateBestScoreDisplay();
                }
            } else {
                gameState.currentCombo = 0;
            }
        }

        function showFloatingScore(points) {
            const board = document.getElementById('game-board');
            const floatingScore = document.createElement('div');
            floatingScore.className = 'floating-score';
            floatingScore.textContent = `+${points}`;
            floatingScore.style.left = '50%';
            floatingScore.style.top = '40%';
            floatingScore.style.transform = 'translate(-50%, -50%)';
            
            board.appendChild(floatingScore);
            
            setTimeout(() => {
                if (board.contains(floatingScore)) {
                    board.removeChild(floatingScore);
                }
            }, 2000);
        }

        function showComboIndicator(combo) {
            const board = document.getElementById('game-board');
            const comboDiv = document.createElement('div');
            comboDiv.className = 'combo-indicator';
            comboDiv.textContent = `COMBO x${combo}!`;
            
            board.appendChild(comboDiv);
            
            setTimeout(() => {
                if (board.contains(comboDiv)) {
                    board.removeChild(comboDiv);
                }
            }, 2500);
        }

        function isGameOver() {
            // Determine if there are any valid moves for ANY unused piece for current grid size
            const unusedPieces = currentPieces.filter(piece => !piece.used);
            if (unusedPieces.length === 0) return false;
            
            const gridSize = gameState.gridSize;
            
            // Early exit: quick occupancy heuristic
            // If the board has any 1x1 empty cell and any piece has a 1x1, it's not game over
            let hasEmpty = false;
            outerEmpty:
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    if (gameState.board[r][c] === 0) { hasEmpty = true; break outerEmpty; }
                }
            }
            if (hasEmpty) {
                const hasSingle = unusedPieces.some(p => p.shape.length === 1 && p.shape[0].length === 1 && p.shape[0][0] === 1);
                if (hasSingle) return false;
            }
            
            // Full check: test every piece at every top-left origin where it could fit
            for (const piece of unusedPieces) {
                const ph = piece.shape.length;
                const pw = piece.shape[0].length;
                if (ph > gridSize || pw > gridSize) continue;
                for (let row = 0; row <= gridSize - ph; row++) {
                    for (let col = 0; col <= gridSize - pw; col++) {
                        if (canPlacePiece(row, col, piece.shape)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function endGame() {
            // Prevent multiple game over calls
            if (!gameState.gameRunning) {
                return;
            }
            
            gameState.gameRunning = false;
            
            // Check if player should advance to next level
            const shouldAdvanceLevel = checkLevelProgression();
            
            // Only show game over modal if NOT advancing level
            if (!shouldAdvanceLevel) {
                document.getElementById('final-score').textContent = gameState.score.toLocaleString();
                document.getElementById('final-lines').textContent = gameState.linesCleared;
                document.getElementById('final-combo').textContent = gameState.bestCombo;
                
                setTimeout(() => {
                    document.getElementById('game-over-modal').classList.remove('hidden');
                }, 1000);
            }
        }
        
        function checkLevelProgression() {
            // Check if player has achieved enough score/lines to advance
            const currentLevel = adminSettings.currentGameLevel;
            const requiredLines = currentLevel * 10; // Each level requires 10 more lines than the previous
            
            if (gameState.linesCleared >= requiredLines) {
                const nextLevel = currentLevel + 1;
                const nextLevelId = `level-${nextLevel}`;
                
                // Show level complete modal
                setTimeout(() => {
                    showLevelCompleteModal(currentLevel, nextLevel, nextLevelId);
                }, 1500);
                
                return true; // Level advancing
            }
            
            return false; // No level advancement
        }
        
        function showLevelCompleteModal(currentLevel, nextLevel, nextLevelId) {
            // Mark level as completed (legacy) and save detailed stats
            updateCompletedLevels(currentLevel);
            const currentCfg = customLevels[`level-${currentLevel}`];
            saveCompletedLevelDetailed(currentLevel, currentCfg?.name);
            // Auto-progress: set next level for "Main Sekarang"
            adminSettings.currentGameLevel = nextLevel;
            localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
            updateBestScoreDisplay();
            // Save end-of-level HUD stats so next level starts from here
            try {
                const lastStats = {
                    score: gameState.score,
                    linesCleared: gameState.linesCleared,
                    bestCombo: gameState.bestCombo,
                    blocksPlaced: gameState.blocksPlaced,
                    bestScore: gameState.bestScore
                };
                localStorage.setItem('quran-quest-last-stats', JSON.stringify(lastStats));
            } catch (_) {}
            
            // Update modal content
            document.getElementById('level-complete-message').textContent = `Anda telah menyelesaikan Level ${currentLevel}!`;
            document.getElementById('level-complete-lines').textContent = gameState.linesCleared;
            document.getElementById('level-complete-score').textContent = gameState.score.toLocaleString();
            
            // Check if next level exists and update button
            const nextLevelBtn = document.getElementById('next-level-btn');
            if (customLevels[nextLevelId]) {
                nextLevelBtn.textContent = `🚀 LANJUT KE LEVEL ${nextLevel}`;
                nextLevelBtn.onclick = () => proceedToNextLevel(nextLevel, nextLevelId);
            } else {
                nextLevelBtn.textContent = `📚 LEVEL ${nextLevel} BELUM TERSEDIA`;
                nextLevelBtn.onclick = () => showNextLevelUnavailable(nextLevel);
            }
            
            // Show the modal
            document.getElementById('level-complete-modal').classList.remove('hidden');
        }
        
        function proceedToNextLevel(nextLevel, nextLevelId) {
            if (customLevels[nextLevelId]) {
                // Store level data for password verification
                pendingLevelData = {
                    nextLevel: nextLevel,
                    nextLevelId: nextLevelId,
                    type: 'normal'
                };
                
                // Show password modal
                showLevelPasswordModal(nextLevel);
            } else {
                showNextLevelUnavailable(nextLevel);
            }
        }
        
        function showNextLevelUnavailable(nextLevel) {
            // Close level complete modal
            document.getElementById('level-complete-modal').classList.add('hidden');
            
            // Update and show unavailable modal
            document.getElementById('next-level-info').textContent = `Level ${nextLevel} diperlukan untuk melanjutkan`;
            document.getElementById('next-level-unavailable-modal').classList.remove('hidden');
        }
        
        function repeatCurrentLevel() {
            // Close all modals
            document.getElementById('level-complete-modal').classList.add('hidden');
            document.getElementById('next-level-unavailable-modal').classList.add('hidden');
            
            // Reset level progress to repeat the current level
            adminSettings.customLevelIndex = 0;
            adminSettings.customLevelClearCount = 0;
            localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
            
            // Continue the current game with reset level progress
            // Don't restart the entire game, just reset the level progress
            showCustomModal('🔄 LEVEL DIULANG!', `Level ${adminSettings.currentGameLevel} dimulai dari awal!\n\nHuruf akan ditampilkan lagi sesuai urutan level ini.`);
        }
        
        function backToMenuFromModal() {
            // Close all modals
            document.getElementById('level-complete-modal').classList.add('hidden');
            document.getElementById('next-level-unavailable-modal').classList.add('hidden');
            
            // Go back to main menu
            backToMenu();
            // Ensure main screen reflects auto-progressed level
            document.getElementById('main-current-level').textContent = adminSettings.currentGameLevel;
        }

        function restartGame() {
            document.getElementById('game-over-modal').classList.add('hidden');
            // Reset game state
            gameState.gameRunning = true;
            initializeGame();
        }

        function updateDisplay() {
            document.getElementById('current-score').textContent = gameState.score.toLocaleString();
            document.getElementById('lines-cleared').textContent = gameState.linesCleared;
            document.getElementById('best-combo').textContent = gameState.bestCombo;
            document.getElementById('blocks-placed').textContent = gameState.blocksPlaced;
            
            // Show the level number based on activeCustomLevel if set (e.g., replay from Level Maps)
            let displayLevel = adminSettings.currentGameLevel;
            if (adminSettings.activeCustomLevel) {
                const parts = String(adminSettings.activeCustomLevel).split('-');
                const maybeNum = parseInt(parts[1]);
                if (!isNaN(maybeNum)) displayLevel = maybeNum;
            }
            document.getElementById('current-level-display').textContent = displayLevel;
        }

        function showLeaderboard() {
            document.getElementById('leaderboard-modal').classList.remove('hidden');
        }

        function closeLeaderboard() {
            document.getElementById('leaderboard-modal').classList.add('hidden');
        }

        function showTutorial() {
            document.getElementById('tutorial-modal').classList.remove('hidden');
        }

        function closeTutorial() {
            document.getElementById('tutorial-modal').classList.add('hidden');
        }

        // Global variable to track if level should complete after learning popup
        let shouldShowLevelComplete = false;
        let levelCompleteData = null;
        let isShowingLevelComplete = false; // Prevent multiple popup overlaps
        
        // Global variable to track if board needs reset after learning popup
        let shouldResetBoardAfterLearning = false;
        
        // Global variables for level password
        let pendingLevelData = null;
        const LEVEL_PASSWORD = 'blast';
        
        // Global variables for level maps
        let completedLevels = [];
        
        // ===== LEVEL MAPS FUNCTIONS =====
        
        // Show level maps modal
        function showLevelMaps() {
            // Generate level buttons
            generateLevelMaps();
            
            // Show modal
            document.getElementById('level-maps-modal').classList.remove('hidden');
        }
        
        // Close level maps modal
        function closeLevelMaps() {
            document.getElementById('level-maps-modal').classList.add('hidden');
        }
        
        // Generate level maps buttons (supports old and new formats)
        function generateLevelMaps() {
            const grid = document.getElementById('level-maps-grid');
            grid.innerHTML = '';
            
            // Get completed levels from localStorage
            const savedCompletedLevels = localStorage.getItem('quran-quest-completed-levels');
            if (savedCompletedLevels) {
                completedLevels = JSON.parse(savedCompletedLevels);
            } else {
                completedLevels = [];
            }
            
            // Normalize to objects
            const normalized = (Array.isArray(completedLevels) ? completedLevels : [])
                .map(item => {
                    if (typeof item === 'number') {
                        const num = item;
                        const lvl = customLevels[`level-${num}`];
                        return { level: num, name: (lvl?.name || `Level ${num}`) };
                    }
                    if (item && typeof item === 'object') return item;
                    return null;
                })
                .filter(Boolean)
                .sort((a,b)=> a.level - b.level);
            
            // Generate buttons
            normalized.forEach(entry => {
                const levelId = `level-${entry.level}`;
                const levelCfg = customLevels[levelId];
                if (levelCfg) {
                    const button = document.createElement('button');
                    button.className = 'bg-gradient-to-br from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 border-2 border-green-400/50';
                    button.innerHTML = `
                        <div class="text-2xl mb-2">🎯</div>
                        <div class="text-lg font-bold">Level ${entry.level}</div>
                        <div class="text-sm opacity-90">${entry.name || levelCfg.name || ('Level ' + entry.level)}</div>
                    `;
                    // Replay without password for completed levels
                    button.onclick = () => selectLevel(entry.level, levelId, { bypassPassword: true });
                    grid.appendChild(button);
                }
            });
            
            if (normalized.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-8">
                        <div class="text-4xl mb-4">📚</div>
                        <div class="text-white text-lg">Belum ada level yang selesai</div>
                        <div class="text-white/70 text-sm">Selesaikan level untuk membuka peta level</div>
                    </div>
                `;
            }
        }
        
        // Select level from maps
        function selectLevel(levelNumber, levelId, options = {}) {
            // Close maps modal
            closeLevelMaps();
            
            // If bypassPassword, start immediately
            if (options.bypassPassword) {
                // Replay completed level WITHOUT changing progression level
                // Keep currentGameLevel as-is so "Main Sekarang" continues progression
                pendingLevelData = null;
                adminSettings.activeCustomLevel = levelId;
                adminSettings.customLevelIndex = 0;
                adminSettings.customLevelClearCount = 0;
                localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
                
                document.getElementById('main-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                initializeGame();
                return;
            }
            
            // Default behavior (password)
            pendingLevelData = {
                nextLevel: levelNumber,
                nextLevelId: levelId,
                type: 'replay'
            };
            showLevelPasswordModal(levelNumber);
        }
        
        // Update completed levels (preserve ALL previous entries; support numbers and objects)
        function updateCompletedLevels(levelNumber) {
            const key = 'quran-quest-completed-levels';
            let existing = [];
            try {
                const raw = localStorage.getItem(key);
                if (raw) existing = JSON.parse(raw) || [];
            } catch { existing = []; }

            // Collect existing level numbers from both formats
            const existingMap = new Map(); // level -> entry (object)
            if (Array.isArray(existing)) {
                existing.forEach(item => {
                    if (typeof item === 'number') {
                        const lvl = item;
                        if (!existingMap.has(lvl)) existingMap.set(lvl, { level: lvl });
                    } else if (item && typeof item === 'object' && typeof item.level === 'number') {
                        existingMap.set(item.level, { ...item });
                    }
                });
            }

            // Ensure new level is included
            if (!existingMap.has(levelNumber)) {
                const cfg = customLevels[`level-${levelNumber}`];
                existingMap.set(levelNumber, { level: levelNumber, name: cfg?.name || `Level ${levelNumber}` });
            }

            // Save back as detailed objects array, sorted
            const out = Array.from(existingMap.values()).sort((a,b)=> (a.level||0) - (b.level||0));
            localStorage.setItem(key, JSON.stringify(out));
            updateLevelMapsButton();
        }

        // Save completed level with stats (new detailed format)
        function saveCompletedLevelDetailed(levelNumber, levelName) {
            const key = 'quran-quest-completed-levels';
            let data = [];
            try {
                const raw = localStorage.getItem(key);
                if (raw) data = JSON.parse(raw) || [];
            } catch { data = []; }
            
            // If old numeric format, convert to objects
            if (data.length && typeof data[0] === 'number') {
                data = data.map(num => ({ level: num }));
            }
            if (!Array.isArray(data)) data = [];
            
            // Find existing entry
            const idx = data.findIndex(e => e && typeof e === 'object' && e.level === levelNumber);
            const entry = (idx >= 0 ? data[idx] : { level: levelNumber });
            
            // Update stats
            entry.name = levelName || entry.name || (customLevels[`level-${levelNumber}`]?.name) || `Level ${levelNumber}`;
            entry.bestScore = Math.max(entry.bestScore || 0, gameState.score || 0);
            entry.bestCombo = Math.max(entry.bestCombo || 0, gameState.bestCombo || 0);
            entry.linesCleared = Math.max(entry.linesCleared || 0, gameState.linesCleared || 0);
            entry.completedAt = new Date().toISOString();
            
            if (idx >= 0) data[idx] = entry; else data.push(entry);
            data.sort((a,b)=> (a.level||0) - (b.level||0));
            localStorage.setItem(key, JSON.stringify(data));
            updateLevelMapsButton();
        }
        
        // Update level maps button visibility
        function updateLevelMapsButton() {
            const levelMapsBtn = document.getElementById('level-maps-btn');
            if (completedLevels.length > 0) {
                levelMapsBtn.classList.remove('hidden');
            } else {
                levelMapsBtn.classList.add('hidden');
            }
        }
        
        // Load completed levels from localStorage
        function loadCompletedLevels() {
            const savedCompletedLevels = localStorage.getItem('quran-quest-completed-levels');
            if (savedCompletedLevels) {
                completedLevels = JSON.parse(savedCompletedLevels);
            } else {
                completedLevels = [];
            }
            
            // Update button visibility
            updateLevelMapsButton();
        }

        // ===== LEVEL PASSWORD FUNCTIONS =====
        
        // Show level password modal
        function showLevelPasswordModal(levelNumber) {
            // Update level number display
            document.getElementById('password-level-number').textContent = levelNumber;
            
            // Clear password input and reset states
            const passwordInput = document.getElementById('level-password-input');
            const errorDiv = document.getElementById('password-error');
            const successDiv = document.getElementById('password-success');
            
            passwordInput.value = '';
            passwordInput.disabled = false;
            passwordInput.classList.remove('password-success', 'password-error', 'animate-shake');
            errorDiv.classList.add('hidden');
            successDiv.classList.add('hidden');
            
            // Close level complete modal
            document.getElementById('level-complete-modal').classList.add('hidden');
            
            // Show password modal
            document.getElementById('level-password-modal').classList.remove('hidden');
            
            // Focus on password input
            setTimeout(() => {
                passwordInput.focus();
                
                // Add Enter key listener
                passwordInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        checkLevelPassword();
                    }
                });
            }, 100);
        }
        
        // Check level password
        function checkLevelPassword() {
            const inputPassword = document.getElementById('level-password-input').value.trim();
            const errorDiv = document.getElementById('password-error');
            const successDiv = document.getElementById('password-success');
            
            if (inputPassword === LEVEL_PASSWORD) {
                // Password correct - show success feedback
                errorDiv.classList.add('hidden');
                
                // Update success message with current level
                const levelNumber = document.getElementById('password-level-number').textContent;
                successDiv.textContent = `✅ Password Benar! Masuk ke Level ${levelNumber}...`;
                successDiv.classList.remove('hidden');
                
                // Proceed to next level after brief delay
                setTimeout(() => {
                    proceedWithLevelAdvancement();
                }, 1500);
            } else {
                // Password incorrect - show error feedback
                successDiv.classList.add('hidden');
                errorDiv.classList.remove('hidden');
                
                // Clear input and focus again
                document.getElementById('level-password-input').value = '';
                setTimeout(() => {
                    document.getElementById('level-password-input').focus();
                }, 100);
            }
        }
        
        
        // Cancel level password
        function cancelLevelPassword() {
            // Close password modal
            document.getElementById('level-password-modal').classList.add('hidden');
            
            // Check if this was called from main menu, level maps, or from level progression
            if (pendingLevelData && (pendingLevelData.type === 'main_menu' || pendingLevelData.type === 'normal' || pendingLevelData.type === 'replay')) {
                // This was called from "Main Sekarang" or "Level Maps" - just go back to main menu
                // Don't show any level complete modal
                pendingLevelData = null;
                return;
            }
            
            // Show level complete modal again (for other cases like level progression)
            document.getElementById('level-complete-modal').classList.remove('hidden');
            
            // Clear pending data
            pendingLevelData = null;
        }
        
        // Proceed with level advancement after password verification
        function proceedWithLevelAdvancement() {
            if (!pendingLevelData) return;
            
            // Close password modal
            document.getElementById('level-password-modal').classList.add('hidden');
            
            // Save unlocked level to localStorage
            const unlockedLevels = JSON.parse(localStorage.getItem('quran-quest-unlocked-levels') || '[]');
            if (!unlockedLevels.includes(pendingLevelData.nextLevel)) {
                unlockedLevels.push(pendingLevelData.nextLevel);
                localStorage.setItem('quran-quest-unlocked-levels', JSON.stringify(unlockedLevels));
            }
            
            // Advance to next level
            adminSettings.currentGameLevel = pendingLevelData.nextLevel;
            adminSettings.activeCustomLevel = pendingLevelData.nextLevelId;
            adminSettings.customLevelIndex = 0;
            adminSettings.customLevelClearCount = 0;
            localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
            
            // Update display
            updateBestScoreDisplay();
            
            if (pendingLevelData.type === 'normal' || pendingLevelData.type === 'main_menu') {
                // Start game for normal levels or from main menu
                document.getElementById('main-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                initializeGame();
                // Seed HUD stats from last level end
                try {
                    const raw = localStorage.getItem('quran-quest-last-stats');
                    if (raw) {
                        const s = JSON.parse(raw);
                        if (s && typeof s === 'object') {
                            if (typeof s.score === 'number') gameState.score = s.score;
                            if (typeof s.linesCleared === 'number') gameState.linesCleared = s.linesCleared;
                            if (typeof s.bestCombo === 'number') gameState.bestCombo = s.bestCombo;
                            if (typeof s.blocksPlaced === 'number') gameState.blocksPlaced = s.blocksPlaced;
                            if (typeof s.bestScore === 'number') gameState.bestScore = Math.max(gameState.bestScore || 0, s.bestScore);
                            updateBestScoreDisplay();
                            updateDisplay();
                        }
                        localStorage.removeItem('quran-quest-last-stats');
                    }
                } catch (_) {}
            } else if (pendingLevelData.type === 'replay') {
                // Replay completed level
                document.getElementById('main-screen').classList.add('hidden');
                document.getElementById('game-screen').classList.remove('hidden');
                initializeGame();
                showCustomModal('🔄 LEVEL DIULANG!', `Memainkan ulang Level ${pendingLevelData.nextLevel}!\n\nHuruf akan ditampilkan sesuai dengan level ini.`);
            } else {
                // Continue game for custom levels
                showCustomModal('🎉 LEVEL BARU DIMULAI!', `Sekarang bermain di Level ${pendingLevelData.nextLevel}!\n\nHuruf baru akan muncul sesuai dengan level ini.`);
            }
            
            // Clear pending data
            pendingLevelData = null;
        }

        function showLearningPopup() {
            // For custom levels, check the trigger count
            if (adminSettings.activeCustomLevel && customLevels[adminSettings.activeCustomLevel]) {
                const level = customLevels[adminSettings.activeCustomLevel];
                if (level) {
                    adminSettings.customLevelClearCount++;
                    const shouldShow = (adminSettings.customLevelClearCount % level.popupTrigger === 0);
                    localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
                    
                    if (!shouldShow) return;
                    
                    // Check if board needs reset (no valid moves available) - only if popup will show
                    shouldResetBoardAfterLearning = isGameOver();
                    
                    // Get letter from custom level
                    let selectedLetter;
                    if (level.letters.length > 0) {
                        // Get the letter character directly from the array
                        const letterChar = level.letters[adminSettings.customLevelIndex % level.letters.length];
                        
                        // Find the corresponding letter object or create a simple one
                        selectedLetter = quranContent.find(letter => letter.letter === letterChar);
                        if (!selectedLetter) {
                            // If not found in quranContent, create a simple object
                            selectedLetter = {
                                letter: letterChar,
                                class: 'hijaiyah-custom',
                                meaning: ''
                            };
                        }
                        
                        // Check if this is the last letter BEFORE incrementing
                        if (adminSettings.customLevelIndex >= level.letters.length - 1) {
                            // This is the last letter, prepare for level complete after popup is closed
                            shouldShowLevelComplete = true;
                            levelCompleteData = level;
                        }
                        
                        // Increment index after checking
                        adminSettings.customLevelIndex++;
                        localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
                    } else {
                        selectedLetter = quranContent[0]; // Fallback
                    }
                    
                    // Update popup content
                    document.getElementById('popup-arabic-letter').textContent = selectedLetter.letter;
                    
                    // Update meaning based on level (optional element)
                    const meaningEl = document.getElementById('popup-letter-meaning');
                    if (meaningEl) {
                        const meaningText = `${selectedLetter.meaning} - Level ${level.number}: ${level.name}`;
                        meaningEl.textContent = meaningText;
                    }
                    
                    // Show the popup
                    document.getElementById('learning-popup').classList.remove('hidden');
                }
            }
        }

        function closeLearningPopup() {
            document.getElementById('learning-popup').classList.add('hidden');
            
            // Check if board needs to be reset after learning popup
            if (shouldResetBoardAfterLearning) {
                console.log('Resetting board after learning popup - no valid moves available');
                resetBoardForNewRound();
                shouldResetBoardAfterLearning = false;
                return; // Don't proceed to level complete check
            }
            
            // Check if level should complete after closing this popup
            if (shouldShowLevelComplete && levelCompleteData && !isShowingLevelComplete) {
                // Prevent multiple popup overlaps
                isShowingLevelComplete = true;
                
                // Wait 2 seconds before showing level complete modal
                setTimeout(() => {
                    showCustomLevelComplete(levelCompleteData);
                    // Reset all flags
                    shouldShowLevelComplete = false;
                    levelCompleteData = null;
                    isShowingLevelComplete = false;
                }, 2000);
            }
        }

        function showCustomLevelComplete(level) {
            // Mark custom level as completed and save detailed stats
            if (level && level.number) {
                const num = parseInt(level.number);
                updateCompletedLevels(num);
                saveCompletedLevelDetailed(num, level.name);
            }

            // Update modal content for custom level completion
            document.getElementById('level-complete-message').textContent = `Alhamdulillah! Level ${level.number}: ${level.name} selesai!`;
            document.getElementById('level-complete-lines').textContent = gameState.linesCleared;
            document.getElementById('level-complete-score').textContent = gameState.score.toLocaleString();
            
            // Check if next level exists
            const nextLevelNumber = parseInt(level.number) + 1;
            const nextLevelId = `level-${nextLevelNumber}`;
            const nextLevelBtn = document.getElementById('next-level-btn');
            
            if (customLevels[nextLevelId]) {
                nextLevelBtn.textContent = `🚀 LANJUT KE LEVEL ${nextLevelNumber}`;
                nextLevelBtn.onclick = () => proceedToCustomNextLevel(nextLevelNumber, nextLevelId);
            } else {
                nextLevelBtn.textContent = `📚 LEVEL ${nextLevelNumber} BELUM TERSEDIA`;
                nextLevelBtn.onclick = () => showNextLevelUnavailable(nextLevelNumber);
            }
            
            // Show the modal
            document.getElementById('level-complete-modal').classList.remove('hidden');
        }

        function proceedToCustomNextLevel(nextLevelNumber, nextLevelId) {
            if (customLevels[nextLevelId]) {
                // Store level data for password verification
                pendingLevelData = {
                    nextLevel: nextLevelNumber,
                    nextLevelId: nextLevelId,
                    type: 'custom'
                };
                
                // Show password modal
                showLevelPasswordModal(nextLevelNumber);
            } else {
                showNextLevelUnavailable(nextLevelNumber);
            }
        }

        // Admin Panel Functions
        function showAdminPanel() {
            document.getElementById('admin-password-modal').classList.remove('hidden');
            document.getElementById('admin-password-input').focus();
            document.getElementById('admin-password-input').value = '';
            document.getElementById('password-error').classList.add('hidden');
            document.getElementById('password-success').classList.add('hidden');
            
            // Re-setup button listeners
            setupPasswordInput();
        }

        // Check admin password
        function checkAdminPassword() {
            console.log('checkAdminPassword called'); // Debug log
            const password = document.getElementById('admin-password-input').value;
            const errorDiv = document.getElementById('password-error');
            const successDiv = document.getElementById('password-success');
            
            console.log('Password entered:', password); // Debug log
            
            if (password === 'blast') {
                // Password correct
                console.log('Password correct!'); // Debug log
                errorDiv.classList.add('hidden');
                successDiv.classList.remove('hidden');
                
                // Show success message briefly then open admin panel
                setTimeout(() => {
                    closeAdminPasswordModal();
                    openAdminPanel();
                }, 1000);
            } else {
                // Password incorrect
                console.log('Password incorrect!'); // Debug log
                successDiv.classList.add('hidden');
                errorDiv.classList.remove('hidden');
                
                // Clear input and shake effect
                document.getElementById('admin-password-input').value = '';
                document.getElementById('admin-password-input').classList.add('animate-shake');
                document.getElementById('admin-password-input').focus();
                setTimeout(() => {
                    document.getElementById('admin-password-input').classList.remove('animate-shake');
                }, 500);
            }
        }

        // Close admin password modal
        function closeAdminPasswordModal() {
            console.log('closeAdminPasswordModal called'); // Debug log
            document.getElementById('admin-password-modal').classList.add('hidden');
        }

        // Open admin panel (after password verification)
        function openAdminPanel() {
            loadAdminSettings();
            updateAdminPanelUI();
            setupLetterInput();
            updateExistingLevels();
            document.getElementById('admin-panel-modal').classList.remove('hidden');
        }

        function closeAdminPanel() {
            document.getElementById('admin-panel-modal').classList.add('hidden');
        }

        function switchTab(tabName) {
            // Update tab buttons
            document.getElementById('tab-game').classList.remove('bg-purple-600');
            document.getElementById('tab-game').classList.add('bg-gray-600');
            document.getElementById('tab-levels').classList.remove('bg-purple-600');
            document.getElementById('tab-levels').classList.add('bg-gray-600');
            
            document.getElementById(`tab-${tabName}`).classList.remove('bg-gray-600');
            document.getElementById(`tab-${tabName}`).classList.add('bg-purple-600');
            
            // Show/hide tab content
            document.getElementById('game-tab').classList.add('hidden');
            document.getElementById('levels-tab').classList.add('hidden');
            document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        }

        function updateAdminPanelUI() {
            document.getElementById('difficulty-level').value = adminSettings.difficulty;
            document.getElementById('grid-size').value = adminSettings.gridSize;
            document.getElementById('piece-count').value = adminSettings.pieceCount;
        }



        function setupLetterInput() {
            const textarea = document.getElementById('level-letters-input');
            if (textarea) {
                textarea.addEventListener('input', updateSelectedLettersCount);
            }
        }

        function updateSelectedLettersCount() {
            const textarea = document.getElementById('level-letters-input');
            if (textarea) {
                const input = textarea.value.trim();
                if (input === '') {
                    document.getElementById('selected-letters-count').textContent = '0';
                    return;
                }
                
                const letters = input.split(',').map(letter => letter.trim()).filter(letter => letter !== '');
                document.getElementById('selected-letters-count').textContent = letters.length;
            }
        }

        function createLevel() {
            const levelNumber = document.getElementById('level-number').value;
            const levelName = document.getElementById('level-name').value;
            const popupTrigger = parseInt(document.getElementById('level-popup-trigger').value);
            const lettersInput = document.getElementById('level-letters-input').value.trim();
            
            if (!levelNumber || !levelName) {
                showCustomModal('⚠️ DATA TIDAK LENGKAP', 'Mohon isi nomor level dan nama level!');
                return;
            }
            
            if (!lettersInput) {
                showCustomModal('⚠️ HURUF BELUM DIISI', 'Mohon input huruf untuk level ini!');
                return;
            }
            
            const selectedLetters = lettersInput.split(',').map(letter => letter.trim()).filter(letter => letter !== '');
            
            if (selectedLetters.length === 0) {
                showCustomModal('⚠️ HURUF TIDAK VALID', 'Mohon input minimal 1 huruf untuk level ini!');
                return;
            }
            
            const levelId = `level-${levelNumber}`;
            
            // Check if level already exists
            if (customLevels[levelId]) {
                if (!confirm(`Level ${levelNumber} sudah ada. Apakah Anda ingin menimpanya?`)) {
                    return;
                }
            }
            
            // Create the level
            customLevels[levelId] = {
                number: levelNumber,
                name: levelName,
                letters: selectedLetters,
                popupTrigger: popupTrigger,
                createdAt: new Date().toISOString()
            };
            
            // Save to localStorage
            saveCustomLevels();
            
            // AUTO-APPLY: Set this level as active
            adminSettings.activeCustomLevel = levelId;
            adminSettings.customLevelIndex = 0;
            adminSettings.customLevelClearCount = 0;
            
            // Save admin settings
            localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
            
            // Update UI to reflect the changes
            updateExistingLevels();
            clearLevelForm();
            
            showCustomModal('✅ LEVEL BERHASIL DIBUAT!', `Level ${levelNumber}: ${levelName} berhasil dibuat dengan ${selectedLetters.length} huruf!\n\n✅ Level ini sudah otomatis diaktifkan di pengaturan game!`);
        }

        function clearLevelForm() {
            document.getElementById('level-number').value = '';
            document.getElementById('level-name').value = '';
            document.getElementById('level-popup-trigger').value = '1';
            document.getElementById('level-letters-input').value = '';
            
            updateSelectedLettersCount();
        }

        function updateExistingLevels() {
            const container = document.getElementById('existing-levels');
            container.innerHTML = '';
            
            const levelIds = Object.keys(customLevels).sort((a, b) => {
                const numA = parseInt(customLevels[a].number);
                const numB = parseInt(customLevels[b].number);
                return numA - numB;
            });
            
            if (levelIds.length === 0) {
                container.innerHTML = '<div class="text-gray-400 text-center py-4">Belum ada level yang dibuat</div>';
                return;
            }
            
            // Get unlocked levels
            const unlockedLevels = JSON.parse(localStorage.getItem('quran-quest-unlocked-levels') || '[]');
            
            levelIds.forEach(levelId => {
                const level = customLevels[levelId];
                const levelNumber = parseInt(level.number);
                const isUnlocked = levelNumber === 1 || unlockedLevels.includes(levelNumber);
                
                const div = document.createElement('div');
                div.className = `bg-gray-700 p-3 rounded-lg flex justify-between items-center ${isUnlocked ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'}`;
                
                div.innerHTML = `
                    <div>
                        <div class="text-white font-bold flex items-center gap-2">
                            Level ${level.number}: ${level.name}
                            ${isUnlocked ? '<span class="text-green-400 text-xs">🔓 UNLOCKED</span>' : '<span class="text-yellow-400 text-xs">🔒 LOCKED</span>'}
                        </div>
                        <div class="text-gray-300 text-sm">${level.letters.length} huruf • Popup setiap ${level.popupTrigger} baris hancur</div>
                        <div class="text-gray-400 text-xs">Huruf: ${level.letters.join(', ')}</div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editLevel('${levelId}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                            ✏️ Edit
                        </button>
                        <button onclick="deleteLevel('${levelId}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                            🗑️ Hapus
                        </button>
                    </div>
                `;
                
                container.appendChild(div);
            });
        }



        // Global variable to store current editing level ID
        let currentEditingLevelId = null;

        function editLevel(levelId) {
            const level = customLevels[levelId];
            if (!level) return;
            
            // Store the level ID being edited
            currentEditingLevelId = levelId;
            
            // Fill the edit form with existing data
            document.getElementById('edit-level-number').value = level.number;
            document.getElementById('edit-level-name').value = level.name;
            document.getElementById('edit-level-popup-trigger').value = level.popupTrigger;
            document.getElementById('edit-level-letters-input').value = level.letters.join(',');
            
            // Update letter count
            updateEditSelectedLettersCount();
            
            // Setup event listener for letter input
            const editTextarea = document.getElementById('edit-level-letters-input');
            editTextarea.removeEventListener('input', updateEditSelectedLettersCount);
            editTextarea.addEventListener('input', updateEditSelectedLettersCount);
            
            // Setup save button
            const saveBtn = document.getElementById('save-edit-level-btn');
            saveBtn.onclick = () => saveEditedLevel();
            
            // Show the edit modal
            document.getElementById('edit-level-modal').classList.remove('hidden');
        }

        function updateEditSelectedLettersCount() {
            const textarea = document.getElementById('edit-level-letters-input');
            if (textarea) {
                const input = textarea.value.trim();
                if (input === '') {
                    document.getElementById('edit-selected-letters-count').textContent = '0';
                    return;
                }
                
                const letters = input.split(',').map(letter => letter.trim()).filter(letter => letter !== '');
                document.getElementById('edit-selected-letters-count').textContent = letters.length;
            }
        }

        function closeEditLevelModal() {
            document.getElementById('edit-level-modal').classList.add('hidden');
            currentEditingLevelId = null;
        }

        function saveEditedLevel() {
            if (!currentEditingLevelId) return;
            
            const levelNumber = document.getElementById('edit-level-number').value;
            const levelName = document.getElementById('edit-level-name').value;
            const popupTrigger = parseInt(document.getElementById('edit-level-popup-trigger').value);
            const lettersInput = document.getElementById('edit-level-letters-input').value.trim();
            
            if (!levelNumber || !levelName) {
                showCustomModal('⚠️ DATA TIDAK LENGKAP', 'Mohon isi nomor level dan nama level!');
                return;
            }
            
            if (!lettersInput) {
                showCustomModal('⚠️ HURUF BELUM DIISI', 'Mohon input huruf untuk level ini!');
                return;
            }
            
            const selectedLetters = lettersInput.split(',').map(letter => letter.trim()).filter(letter => letter !== '');
            
            if (selectedLetters.length === 0) {
                showCustomModal('⚠️ HURUF TIDAK VALID', 'Mohon input minimal 1 huruf untuk level ini!');
                return;
            }
            
            // Check if level number changed and conflicts with existing level
            const newLevelId = `level-${levelNumber}`;
            if (newLevelId !== currentEditingLevelId && customLevels[newLevelId]) {
                showCustomModal('⚠️ NOMOR LEVEL SUDAH ADA', `Level ${levelNumber} sudah ada! Gunakan nomor level yang berbeda.`);
                return;
            }
            
            // Show confirmation before saving
            showCustomConfirm(
                '💾 KONFIRMASI EDIT',
                `Apakah Anda yakin ingin menyimpan perubahan untuk Level ${levelNumber}: ${levelName}?\n\nPerubahan akan langsung tersimpan dan tidak bisa dibatalkan.`,
                () => {
                    // If level number changed, delete old entry and create new one
                    if (newLevelId !== currentEditingLevelId) {
                        delete customLevels[currentEditingLevelId];
                        
                        // Update active level reference if needed
                        if (adminSettings.activeCustomLevel === currentEditingLevelId) {
                            adminSettings.activeCustomLevel = newLevelId;
                        }
                    }
                    
                    // Save the updated level
                    customLevels[newLevelId] = {
                        number: levelNumber,
                        name: levelName,
                        letters: selectedLetters,
                        popupTrigger: popupTrigger,
                        createdAt: customLevels[currentEditingLevelId]?.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    // Save to localStorage
                    saveCustomLevels();
                    localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
                    
                    // Update UI
                    updateExistingLevels();
                    closeEditLevelModal();
                    
                    showCustomModal('✅ LEVEL BERHASIL DIUPDATE!', `Level ${levelNumber}: ${levelName} berhasil diperbarui dengan ${selectedLetters.length} huruf!`);
                }
            );
        }

        function deleteLevel(levelId) {
            const level = customLevels[levelId];
            if (!level) return;
            
            // Show custom confirmation dialog
            showCustomConfirm(
                '🗑️ KONFIRMASI HAPUS',
                `Apakah Anda yakin ingin menghapus Level ${level.number}: ${level.name}?\n\nTindakan ini tidak dapat dibatalkan!\n\nLevel ini berisi ${level.letters.length} huruf: ${level.letters.join(', ')}`,
                () => {
                    // Delete the level
                    delete customLevels[levelId];
                    saveCustomLevels();
                    updateExistingLevels();
                    
                    // If this was the active level, reset it
                    if (adminSettings.activeCustomLevel === levelId) {
                        adminSettings.activeCustomLevel = '';
                        localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
                    }
                    
                    showCustomModal('🗑️ LEVEL DIHAPUS', `Level ${level.number}: ${level.name} berhasil dihapus!`);
                }
            );
        }

        function saveAdminSettings() {
            adminSettings.difficulty = document.getElementById('difficulty-level').value;
            adminSettings.gridSize = parseInt(document.getElementById('grid-size').value);
            adminSettings.pieceCount = parseInt(document.getElementById('piece-count').value);
            
            // Reset custom level progress when changing active level
            adminSettings.customLevelIndex = 0;
            adminSettings.customLevelClearCount = 0;
            
            // Save to localStorage
            localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
            
            // Show success message
            showCustomModal('💾 PENGATURAN TERSIMPAN', 'Pengaturan berhasil disimpan! Mulai game baru untuk menerapkan perubahan.');
            
            closeAdminPanel();
        }



        // Custom modal functions
        function showCustomModal(title, message) {
            const modal = document.getElementById('custom-alert-modal');
            document.getElementById('custom-alert-title').textContent = title;
            document.getElementById('custom-alert-message').textContent = message;
            modal.classList.remove('hidden');
        }
        
        function closeCustomModal() {
            const modal = document.getElementById('custom-alert-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }

        function showCustomConfirm(title, message, onConfirm) {
            const modal = document.getElementById('custom-confirm-modal');
            document.getElementById('custom-confirm-title').textContent = title;
            document.getElementById('custom-confirm-message').textContent = message;
            
            // Set up the confirm button
            const confirmBtn = document.getElementById('custom-confirm-yes');
            confirmBtn.onclick = () => {
                closeCustomConfirm();
                if (onConfirm) onConfirm();
            };
            
            modal.classList.remove('hidden');
        }
        
        function closeCustomConfirm() {
            const modal = document.getElementById('custom-confirm-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }

        // Export Settings Function
        function exportSettings() {
            try {
                // Collect all settings data
                const exportData = {
                    version: "1.0",
                    exportDate: new Date().toISOString(),
                    gameName: "Quran Quest",
                    adminSettings: adminSettings,
                    customLevels: customLevels,
                    bestScore: gameState.bestScore
                };
                
                // Create and download file
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `quran-quest-settings-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                showCustomModal('✅ EXPORT BERHASIL!', `Pengaturan berhasil diexport ke file:\n\n📁 ${link.download}\n\nFile berisi:\n• Pengaturan game (${Object.keys(adminSettings).length} item)\n• Level custom (${Object.keys(customLevels).length} level)\n• Skor tertinggi: ${gameState.bestScore.toLocaleString()}`);
                
            } catch (error) {
                console.error('Export error:', error);
                showCustomModal('❌ EXPORT GAGAL!', `Terjadi kesalahan saat export:\n\n${error.message}\n\nSilakan coba lagi.`);
            }
        }

        // Import Settings Function
        function importSettings() {
            document.getElementById('import-settings-modal').classList.remove('hidden');
            document.getElementById('import-file-info').classList.add('hidden');
            document.getElementById('import-file-input').value = '';
            
            // Setup file input listener
            const fileInput = document.getElementById('import-file-input');
            fileInput.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    document.getElementById('selected-file-name').textContent = file.name;
                    document.getElementById('import-file-info').classList.remove('hidden');
                }
            };
        }

        // Close import modal
        function closeImportModal() {
            document.getElementById('import-settings-modal').classList.add('hidden');
            document.getElementById('import-file-input').value = '';
            document.getElementById('import-file-info').classList.add('hidden');
        }

        // Process import
        function processImport() {
            const fileInput = document.getElementById('import-file-input');
            const file = fileInput.files[0];
            
            if (!file) {
                showCustomModal('⚠️ FILE BELUM DIPILIH', 'Silakan pilih file JSON terlebih dahulu!');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importData = JSON.parse(e.target.result);
                    // Basic schema validation
                    const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
                    if (!isObject(importData)) throw new Error('Struktur utama bukan object');
                    if (!isObject(importData.adminSettings)) throw new Error('adminSettings tidak valid');
                    if (!isObject(importData.customLevels)) throw new Error('customLevels tidak valid');
                    if (importData.adminSettings.gridSize && ![6,8,10].includes(parseInt(importData.adminSettings.gridSize))) {
                        throw new Error('gridSize harus 6, 8, atau 10');
                    }
                    if (importData.adminSettings.pieceCount && ![2,3,4,5].includes(parseInt(importData.adminSettings.pieceCount))) {
                        throw new Error('pieceCount harus 2-5');
                    }
                    
                    // Validate file structure
                    if (!importData.adminSettings || !importData.customLevels) {
                        throw new Error('File tidak valid: struktur data tidak sesuai');
                    }
                    
                    // Show confirmation with import details
                    const levelCount = Object.keys(importData.customLevels).length;
                    const settingsCount = Object.keys(importData.adminSettings).length;
                    
                    showCustomConfirm(
                        '📥 KONFIRMASI IMPORT',
                        `Apakah Anda yakin ingin import pengaturan ini?\n\n📊 Data yang akan diimport:\n• Pengaturan game: ${settingsCount} item\n• Level custom: ${levelCount} level\n• Skor tertinggi: ${importData.bestScore ? importData.bestScore.toLocaleString() : 'Tidak ada'}\n\n⚠️ Import akan menimpa pengaturan yang ada saat ini!`,
                        () => {
                            // Perform import
                            performImport(importData);
                        }
                    );
                    
                } catch (error) {
                    console.error('Import error:', error);
                    showCustomModal('❌ IMPORT GAGAL!', `File tidak valid atau rusak:\n\n${error.message}\n\nPastikan file adalah export dari Quran Quest yang valid.`);
                }
            };
            
            reader.readAsText(file);
        }

        // Perform the actual import
        function performImport(importData) {
            try {
                // Import admin settings
                adminSettings = { ...adminSettings, ...importData.adminSettings };
                
                // Import custom levels
                customLevels = { ...customLevels, ...importData.customLevels };
                
                // Import best score if available
                if (importData.bestScore && importData.bestScore > gameState.bestScore) {
                    gameState.bestScore = importData.bestScore;
                    localStorage.setItem('quran-quest-best', gameState.bestScore.toString());
                }
                
                // Save to localStorage
                localStorage.setItem('quran-quest-admin-settings', JSON.stringify(adminSettings));
                localStorage.setItem('quran-quest-custom-levels', JSON.stringify(customLevels));
                
                // Update UI
                updateAdminPanelUI();
                updateExistingLevels();
                updateBestScoreDisplay();
                
                // Re-initialize game board to apply grid size change
                initializeGame();
                
                // Close modal
                closeImportModal();
                
                // Show success message
                const levelCount = Object.keys(customLevels).length;
                showCustomModal('✅ IMPORT BERHASIL!', `Pengaturan berhasil diimport!\n\n📊 Data yang diimport:\n• Pengaturan game: ${Object.keys(importData.adminSettings).length} item\n• Level custom: ${levelCount} level\n• Skor tertinggi: ${importData.bestScore ? importData.bestScore.toLocaleString() : 'Tidak ada'}\n\n🎮 Game siap dimainkan dengan pengaturan baru!`);
                
            } catch (error) {
                console.error('Import execution error:', error);
                showCustomModal('❌ IMPORT GAGAL!', `Terjadi kesalahan saat memproses import:\n\n${error.message}\n\nSilakan coba lagi.`);
            }
        }

        // Reset Settings Function
        function resetSettings() {
            // Show confirmation dialog
            showCustomConfirm(
                '🔄 KONFIRMASI RESET',
                `⚠️ PERHATIAN! Tindakan ini akan menghapus SEMUA data:\n\n🗑️ Yang akan dihapus:\n• Semua pengaturan game\n• Semua level custom yang dibuat\n• Skor tertinggi\n• Progress level\n\n❌ Tindakan ini TIDAK DAPAT DIBATALKAN!\n\nApakah Anda yakin ingin mereset semua pengaturan?`,
                () => {
                    // Perform reset
                    performReset();
                }
            );
        }

        // Perform the actual reset
        function performReset() {
            try {
                // Reset admin settings to default
                adminSettings = {
                    difficulty: 'medium',
                    gridSize: 8,
                    pieceCount: 3,
                    activeCustomLevel: '',
                    customLevelIndex: 0,
                    customLevelClearCount: 0,
                    currentGameLevel: 1
                };
                
                // Reset custom levels
                customLevels = {};
                
                // Reset best score
                gameState.bestScore = 0;
                
                // Clear localStorage
                localStorage.removeItem('quran-quest-admin-settings');
                localStorage.removeItem('quran-quest-custom-levels');
                localStorage.removeItem('quran-quest-best');
                localStorage.removeItem('quran-quest-unlocked-levels');
                
                // Update UI
                updateAdminPanelUI();
                updateExistingLevels();
                updateBestScoreDisplay();
                
                // Show success message
                showCustomModal('✅ RESET BERHASIL!', `Semua pengaturan telah direset ke default!\n\n🔄 Yang telah direset:\n• Pengaturan game: Default\n• Level custom: 0 level\n• Skor tertinggi: 0\n• Progress level: Level 1\n• Level yang di-unlock: Reset\n\n📝 Anda perlu membuat level baru sebelum bisa bermain.`);
                
            } catch (error) {
                console.error('Reset error:', error);
                showCustomModal('❌ RESET GAGAL!', `Terjadi kesalahan saat reset:\n\n${error.message}\n\nSilakan coba lagi.`);
            }
        }

        // Handle window resize and orientation change
        function handleResize() {
            if (gameState.gameRunning) {
                // Only recreate board if game is running
                createGameBoard();
                // Don't call addInitialBlocks() here to avoid adding random blocks
                // The board will maintain its current state
            }
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', init);
        
        // Add resize and orientation change listeners
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            // Small delay to allow orientation change to complete
            setTimeout(handleResize, 100);
        });

        // ===== IMPORT TXT FUNCTIONS =====
        
        // Setup file input listeners for import TXT
        function setupImportTxtListeners() {
            // Create level import
            const importFileInput = document.getElementById('import-letters-file');
            if (importFileInput) {
                importFileInput.addEventListener('change', handleImportTxt);
            }
            
            // Edit level import
            const editImportFileInput = document.getElementById('edit-import-letters-file');
            if (editImportFileInput) {
                editImportFileInput.addEventListener('change', handleEditImportTxt);
            }
        }
        
        // Handle import TXT for create level
        function handleImportTxt(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (file.type !== 'text/plain') {
                showCustomModal('❌ FORMAT FILE SALAH!', 'File harus berformat .txt (text/plain).\n\nSilakan pilih file .txt yang valid.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                console.log('File content:', content); // Debug log
                
                const letters = parseTxtContent(content);
                console.log('Parsed letters:', letters); // Debug log
                
                if (letters.length === 0) {
                    showCustomModal('⚠️ FILE KOSONG!', 'File TXT tidak mengandung huruf yang valid.\n\nPastikan file berisi huruf Arab dipisah koma.\n\nContoh format:\nك،م،ت،ل،ا،ب،ج،ح');
                    return;
                }
                
                // Update textarea
                const textarea = document.getElementById('level-letters-input');
                textarea.value = letters.join(',');
                
                // Update counter
                updateSelectedLettersCount();
                
                showCustomModal('✅ IMPORT BERHASIL!', `Berhasil mengimport ${letters.length} huruf dari file TXT.\n\nHuruf yang diimport:\n${letters.join(', ')}`);
            };
            
            reader.onerror = function() {
                showCustomModal('❌ ERROR BACA FILE!', 'Gagal membaca file TXT.\n\nPastikan file tidak rusak dan dapat dibaca.');
            };
            
            reader.readAsText(file, 'UTF-8');
        }
        
        // Handle import TXT for edit level
        function handleEditImportTxt(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (file.type !== 'text/plain') {
                showCustomModal('❌ FORMAT FILE SALAH!', 'File harus berformat .txt (text/plain).\n\nSilakan pilih file .txt yang valid.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                console.log('Edit file content:', content); // Debug log
                
                const letters = parseTxtContent(content);
                console.log('Edit parsed letters:', letters); // Debug log
                
                if (letters.length === 0) {
                    showCustomModal('⚠️ FILE KOSONG!', 'File TXT tidak mengandung huruf yang valid.\n\nPastikan file berisi huruf Arab dipisah koma.\n\nContoh format:\nك،م،ت،ل،ا،ب،ج،ح');
                    return;
                }
                
                // Update textarea
                const textarea = document.getElementById('edit-level-letters-input');
                textarea.value = letters.join(',');
                
                // Update counter
                updateEditSelectedLettersCount();
                
                showCustomModal('✅ IMPORT BERHASIL!', `Berhasil mengimport ${letters.length} huruf dari file TXT.\n\nHuruf yang diimport:\n${letters.join(', ')}`);
            };
            
            reader.onerror = function() {
                showCustomModal('❌ ERROR BACA FILE!', 'Gagal membaca file TXT.\n\nPastikan file tidak rusak dan dapat dibaca.');
            };
            
            reader.readAsText(file, 'UTF-8');
        }
        
        // Parse TXT content to extract Arabic letters
        function parseTxtContent(content) {
            // Remove extra whitespace and normalize content
            content = content.trim();
            console.log('Original content:', content); // Debug log
            console.log('Content length:', content.length); // Debug log
            
            // Split by various delimiters (including Arabic comma ، and regular comma ,)
            // Use more specific regex to avoid issues with mixed delimiters
            const parts = content.split(/[,،\s;|;\n\r]+/);
            console.log('Split parts:', parts); // Debug log
            console.log('Parts count:', parts.length); // Debug log
            
            const letters = [];
            
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i].trim();
                console.log(`Part ${i}: "${part}" (length: ${part.length})`); // Debug log
                
                if (!part) continue;
                
                // Check if it's a valid Arabic letter (single character)
                if (part.length === 1 && isValidArabicLetter(part)) {
                    letters.push(part);
                    console.log('Added single letter:', part); // Debug log
                }
                // Also check for multi-character Arabic words (split them)
                else if (part.length > 1) {
                    console.log('Multi-char part, splitting...'); // Debug log
                    for (let j = 0; j < part.length; j++) {
                        let char = part[j];
                        console.log(`Char ${j}: "${char}" (code: ${char.charCodeAt(0)})`); // Debug log
                        if (isValidArabicLetter(char)) {
                            letters.push(char);
                            console.log('Added char from word:', char); // Debug log
                        }
                    }
                }
            }
            
            console.log('All letters before dedup:', letters); // Debug log
            console.log('Total letters count before dedup:', letters.length); // Debug log
            
            // Keep all letters (including duplicates for now to debug)
            return letters;
        }
        
        // Check if character is valid Arabic letter
        function isValidArabicLetter(char) {
            // Arabic Unicode ranges
            const arabicRanges = [
                [0x0600, 0x06FF], // Arabic
                [0x0750, 0x077F], // Arabic Supplement
                [0x08A0, 0x08FF], // Arabic Extended-A
                [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
                [0xFE70, 0xFEFF]  // Arabic Presentation Forms-B
            ];
            
            const code = char.charCodeAt(0);
            return arabicRanges.some(([start, end]) => code >= start && code <= end);
        }
        
        // Clear letters input for create level
        function clearLettersInput() {
            const textarea = document.getElementById('level-letters-input');
            textarea.value = '';
            updateSelectedLettersCount();
        }
        
        // Clear letters input for edit level
        function clearEditLettersInput() {
            const textarea = document.getElementById('edit-level-letters-input');
            textarea.value = '';
            updateEditSelectedLettersCount();
        }

        // ===== BOARD RESET FUNCTIONS =====
        
        // Reset board for new round while preserving score and progress
        function resetBoardForNewRound() {
            console.log('Resetting board for new round...');
            
            // Clear the current board
            clearBoard();
            
            // Generate new pieces
            generateNewPieces();
            
            // Add some initial blocks to make it interesting
            addInitialBlocks();
            
            // Update display
            updateDisplay();
            
            // Show success message
            showCustomModal('🔄 PAPAN DI-RESET!', 'Papan game telah di-reset dengan block baru!\n\nSkor dan progress tetap dipertahankan.\n\nLanjutkan bermain!');
        }
        
        // Clear the game board
        function clearBoard() {
            const board = document.getElementById('game-board');
            const cells = board.querySelectorAll('.grid-cell');
            
            // Clear all cells
            cells.forEach(cell => {
                cell.classList.remove('filled', 'hijaiyah-alif', 'hijaiyah-ba', 'hijaiyah-ta', 'hijaiyah-tsa', 
                    'hijaiyah-jim', 'hijaiyah-ha', 'hijaiyah-kha', 'hijaiyah-dal', 'hijaiyah-dzal',
                    'hijaiyah-ra', 'hijaiyah-za', 'hijaiyah-sin', 'hijaiyah-syin', 'hijaiyah-shad',
                    'hijaiyah-dhad', 'hijaiyah-tha', 'hijaiyah-zha', 'hijaiyah-ain', 'hijaiyah-ghain',
                    'hijaiyah-fa', 'hijaiyah-qaf', 'hijaiyah-kaf', 'hijaiyah-lam', 'hijaiyah-mim',
                    'hijaiyah-nun', 'hijaiyah-waw', 'hijaiyah-ha2', 'hijaiyah-ya', 'hijaiyah-custom');
                cell.textContent = '';
            });
            
            // Reset game state board
            const gridSize = gameState.gridSize;
            gameState.board = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
            gameState.boardLetters = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
        }
        

