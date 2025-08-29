const API_URL = "https://6874ce63dd06792b9c954fc7.mockapi.io/api/v1/users";

async function fetchUsers() {
  const res = await fetch(API_URL);
  return await res.json();
}

function computeMetrics(users) {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 29);
  start.setHours(0,0,0,0);

  let withAvatar = 0, withoutAvatar = 0;
  const days = {};
  for (let i=0; i<30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0,10);
    days[key] = 0;
  }

  const hours = Array(24).fill(0);

  users.forEach(u => {
    const createdAt = new Date(u.createdAt);
    if (u.avatar && u.avatar.trim() !== "") withAvatar++;
    else withoutAvatar++;

    const key = createdAt.toISOString().slice(0,10);
    if (days[key] !== undefined) days[key]++;

    const h = createdAt.getUTCHours();
    hours[h]++;
  });

  const recent = users
    .sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))
    .slice(0,5);

  return {
    totalUsers: users.length,
    usersPerDay: Object.entries(days).map(([date,count]) => ({date,count})),
    avatarDistribution: {withAvatar, withoutAvatar},
    signupHours: hours.map((count,hour)=>({hour,count})),
    recentUsers: recent,
    generatedAt: new Date().toLocaleString()
  };
}

function renderDashboard(metrics) {
  document.getElementById("totalUsers").textContent = metrics.totalUsers;
  document.getElementById("withAvatars").textContent = metrics.avatarDistribution.withAvatar;
  document.getElementById("generatedAt").textContent = metrics.generatedAt;

  
  // Users per day
  new Chart(document.getElementById("usersPerDay"), {
    type: 'line',
    data: {
      labels: metrics.usersPerDay.map(d=>d.date),
      datasets: [{
        label: "Users per Day",
        data: metrics.usersPerDay.map(d=>d.count),
        borderColor: "#0ea5e9",
        fill: false
      }]
    }
  });

  // Avatar distribution
  new Chart(document.getElementById("avatarDist"), {
    type: 'pie',
    data: {
      labels: ["With Avatar","Without Avatar"],
      datasets: [{
        data: [metrics.avatarDistribution.withAvatar, metrics.avatarDistribution.withoutAvatar],
        backgroundColor: ["#0ea5e9","#e5e7eb"]
      }]
    }
  });

  // Signup hours
  new Chart(document.getElementById("signupHours"), {
    type: 'bar',
    data: {
      labels: metrics.signupHours.map(d=>d.hour),
      datasets: [{
        label: "Signups per Hour (UTC)",
        data: metrics.signupHours.map(d=>d.count),
        backgroundColor: "orange"
      }]
    }
  });

  // Recent users
  const ul = document.getElementById("recentUsers");
  metrics.recentUsers.forEach(u=>{
    const li = document.createElement("li");
    li.textContent = `${u.name} (${u.email || "—"})`;
    ul.appendChild(li);
  });
}

async function init() {
  const users = await fetchUsers();
  const metrics = computeMetrics(users);
  renderDashboard(metrics);
}
init();
