document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('results-container');
    const noResultsMessage = document.getElementById('no-results-message');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const loader = document.getElementById('loader');

    let activeFilter = 'All';

    function renderResults(resources) {
        resultsContainer.innerHTML = '';
        noResultsMessage.classList.add('hidden');

        if (!resources || resources.length === 0) {
            noResultsMessage.classList.remove('hidden');
            return;
        }

        resources.forEach(resource => {
            // **调试步骤 1**: 在浏览器控制台打印出每个资源对象
            // 让我们能看到前端实际接收到的数据结构和内容。
            console.log("正在处理的资源 (Processing resource):", resource);

            let navButtonHtml = '';
            
            // 检查地址信息是否存在且不为空字符串
            if (resource.address && resource.city && resource.state) {
                const fullAddress = `${resource.address}, ${resource.city}, ${resource.state} ${resource.zip || ''}`;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
                navButtonHtml = `
                    <div class="px-6 pb-6 pt-2">
                        <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            Google Maps 导航
                        </a>
                    </div>
                `;
            } else {
                // **调试步骤 2**: 如果条件不满足，在卡片上显示提示信息。
                navButtonHtml = `
                    <div class="px-6 pb-6 pt-2">
                        <p class="text-xs text-gray-400 text-center">无法生成导航：地址信息不完整</p>
                    </div>
                `;
            }

            const card = `
                <div class="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col h-full">
                    <div class="p-6 flex-grow">
                        <div class="font-bold text-xl text-blue-700 mb-2">${resource.name}</div>
                        <span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full mb-3">${resource.category}</span>
                        <p class="text-gray-700 text-base mb-4">${resource.description || ''}</p>
                        <ul class="text-gray-600 space-y-2 text-sm">
                            <li class="flex items-start">
                                <svg class="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span>${resource.address || 'N/A'}, ${resource.city || ''}, ${resource.state || ''} ${resource.zip || ''}</span>
                            </li>
                            <li class="flex items-center">
                                 <svg class="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                <span>${resource.phone || 'N/A'}</span>
                            </li>
                            <li class="flex items-center">
                                <svg class="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>${resource.hours || 'N/A'}</span>
                            </li>
                        </ul>
                    </div>
                    ${navButtonHtml}
                </div>`;
            resultsContainer.innerHTML += card;
        });
    }

    async function fetchAndRender() {
        const searchTerm = searchInput.value;
        const url = `/api/resources?category=${encodeURIComponent(activeFilter)}&search=${encodeURIComponent(searchTerm)}`;
        
        loader.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        noResultsMessage.classList.add('hidden');

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            renderResults(data);
        } catch (error) {
            console.error("Fetch error:", error);
            resultsContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">加载资源失败，请稍后重试。</p>`;
        } finally {
            loader.classList.add('hidden');
        }
    }

    searchButton.addEventListener('click', fetchAndRender);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            fetchAndRender();
        }
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeFilter = button.dataset.filter;
            fetchAndRender();
        });
    });

    fetchAndRender();
});
