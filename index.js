document.getElementById('btn1').addEventListener('click', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('mobile_number').value.trim();
    const PreferedLanguage = document.getElementById('language').value;
    const Skills = document.getElementById('skills').value.trim();
    const reg_no = document.getElementById('reg').value.trim();
    const Batch = document.getElementById('Batch').value;

    if (!email || !email.includes('@')) {
        alert('Please enter a valid email');
        return;
    }

    if (!name || !password || !phone || !Skills || !reg_no || Batch === '' || PreferedLanguage === 'select') {
        alert('Please fill out all fields');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, PreferedLanguage, Skills, reg_no, Batch })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.ok) {
            alert(data.message || 'Submitted successfully');
            window.location.href = 'https://ccpc-cuj.web.app/';
            return;
        }

        const message = data.message || data.error || 'Something went wrong. Try again!';
        alert(message);
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Try again!');
    }
});
