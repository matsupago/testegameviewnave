// Add CORS configuration in Supabase dashboard to allow your GitHub Pages domain
// The domain will be: https://YOUR_USERNAME.github.io/green-space-shooter/

// Update your Supabase configuration to check for the production environment
const SUPABASE_URL = 'https://vfnhwgifaygelphnmaox.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbmh3Z2lmYXlnZWxwaG5tYW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MTI4NTQsImV4cCI6MjA1NjE4ODg1NH0.6CeMx0HKtGUPIuoN1yhTrm3vKwMWN_5QOT4Yr100Imo'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function initializeGame() {
    try {
        // Test connection
        const { data, error } = await supabase
            .from('leaderboard')
            .select('count')
            .single()
            
        if (error) throw error
        console.log('Successfully connected to Supabase')
    } catch (error) {
        console.error('Error connecting to Supabase:', error.message)
    }
}

async function submitScore() {
    try {
        const email = document.getElementById('playerEmail').value
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email')
            return
        }

        const { error } = await supabase
            .from('leaderboard')
            .insert({
                email: email,
                score: Number(window.score),
                level: Number(window.currentLevel)
            })

        if (error) throw error

        document.getElementById('gameOverModal').style.display = 'none'
        await updateLeaderboard()
        document.getElementById('leaderboardModal').style.display = 'block'
    } catch (error) {
        console.error('Error details:', error)
        alert('Error submitting score: ' + error.message)
    }
}

async function updateLeaderboard() {
    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(10)

        if (error) throw error

        const leaderboardDiv = document.getElementById('leaderboardEntries')
        leaderboardDiv.innerHTML = data.map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>Player X (${entry.email.split('@')[0]})</td>
                <td>${entry.score}</td>
                <td>${entry.level}</td>
            </tr>
        `).join('')
    } catch (error) {
        console.error('Error updating leaderboard:', error)
    }
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').style.display = 'none'
    resetGame()
    loop()
}

function shareOnTwitter() {
    const score = document.getElementById('finalScore').textContent
    const tweetText = `I just scored ${score} points in AI Invasion! Can you beat my score? #AIInvasion #GameDev`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank')
}

function restartGame() {
    document.getElementById('leaderboardModal').style.display = 'none'
    resetGame()
    loop()
}

function skipSubmission() {
    document.getElementById('gameOverModal').style.display = 'none'
    document.getElementById('leaderboardModal').style.display = 'block'
}

// Inicializar o leaderboard quando a página carregar
document.addEventListener('DOMContentLoaded', initializeGame) 
