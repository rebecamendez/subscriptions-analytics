export default class UI {
  constructor() {
    this.authButton = document.getElementById('auth-button');
    this.subscriptionsButton = document.getElementById('get-subscriptions');
    this.totalSubscriptions = document.getElementById('total-subscriptions');
    this.subscriptionsList = document.getElementById('subscriptions-list');
    this.loader = document.getElementById('loader');
  }

  showLoader() {
    this.loader.style.display = 'block';
  }

  hideLoader() {
    this.loader.style.display = 'none';
  }

  showAuthButton(onClick) {
    this.#toggleElement(this.authButton, true);
    this.authButton.addEventListener('click', onClick);
  }

  showSubscriptionsButton(onClick) {
    if (window.location.hash) {
      history.replaceState(null, null, window.location.pathname);
    }
    this.#toggleElement(this.authButton, false);
    this.#toggleElement(this.subscriptionsButton, true);
    this.subscriptionsButton.addEventListener('click', onClick);
  }

  showTotalSubscriptions(total) {
    this.totalSubscriptions.textContent = `Total Subscriptions: ${total}`;
  }

  showCategorizedChannels(groupedChannels) {
    this.subscriptionsList.innerHTML = '';

    Object.keys(groupedChannels).forEach((category) => {
      const channels = groupedChannels[category];

      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.innerHTML = `<strong>${category}</strong> (${channels.length} channels)`;

      const channelList = document.createElement('ul');
      channelList.classList.add('channel-list');

      channels.forEach((channel) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>${channel}</span>`;
        channelList.appendChild(listItem);
      });

      details.appendChild(summary);
      details.appendChild(channelList);
      this.subscriptionsList.appendChild(details);
    });
  }

  showCategorizedChannelsChart(groupedChannels) {
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => this.#drawChart(groupedChannels));
  }

  showError(message) {
    this.loader.innerHTML = `<p style="color: red;">Error: ${message}</p>`;
  }

  // --- 🔐 Private methods ---

  #toggleElement(element, show) {
    element.style.display = show ? 'block' : 'none';
  }

  #drawChart(groupedChannels) {
    const categories = Object.keys(groupedChannels);
    const channelCounts = categories.map((category) => groupedChannels[category].length);
    const totalChannels = channelCounts.reduce((sum, count) => sum + count, 0);
    const minPercentage = 4;

    let otherCount = 0;
    const otherLabel = 'Others';

    const filteredData = categories
      .map((category, index) => {
        const count = channelCounts[index];
        const percentage = (count / totalChannels) * 100;
        return { category, count, percentage };
      })
      .reduce(
        (acc, data) => {
          if (data.percentage > minPercentage) {
            acc.filtered.push([data.category, data.count]);
          } else {
            otherCount += data.count;
          }
          return acc;
        },
        { filtered: [] }
      );

    if (otherCount > 0) {
      filteredData.filtered.push([otherLabel, otherCount]);
    }

    const data = google.visualization.arrayToDataTable([['Category', 'Count'], ...filteredData.filtered]);

    const options = {
      title: 'Channel Categories',
      pieHole: 0.2,
      pieSliceText: 'percentage',
      legend: { position: 'right', alignment: 'center' },
      backgroundColor: 'transparent',
      animation: {
        startup: true,
        duration: 1000,
        easing: 'out'
      },
      chartArea: { width: '100%', height: '100%' }
    };

    const chart = new google.visualization.PieChart(document.getElementById('category-chart'));
    chart.draw(data, options);
  }
}
