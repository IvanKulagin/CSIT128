function search() {
    fetch("/admin/internship", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: document.getElementById("searchInput").value.trim().split(" "),
        })
    })
        .then(response => response.json())
        .then(json => {
            div = document.getElementById("internshipsContainer")
            div.innerHTML = ""
            json.forEach((internship) => {
                div.innerHTML += `<a href="/admin/internship/${internship.id}">
                    <div class="internship-card">
                        <h3>${internship.title}</h3>
                        <p>Location: ${internship.location}</p>
                        <p>Duration: ${internship.duration} Month(s)</p>
                    </div>
                </a>`
            })
        })
}
document.addEventListener("DOMContentLoaded", search)
document.getElementById("searchInput").addEventListener("input", search)
