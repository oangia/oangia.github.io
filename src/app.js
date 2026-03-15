// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
$ = {}
$.form = ({url, formId, formData, validation = {rules: {}, messages: {}}, success = () => {}}) => {
    const form = document.getElementById(formId);
    if (form == undefined) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = formData();
        const validator = new Validator(data, validation.rules, validation.messages);
        const errors = validator.validate();
  
        if (errors.length) {
            showToast(errors.join("<br/>"), "error");
            return;
        }

        loading();
        const curl = new CUrl;
        curl.json();
        const res = await curl.connect(url, "POST", data);
        console.log(res);
        if (res.status != 200) {
            const messages = res.data.errors
                        ? Object.values(res.data.errors).flat()
                        : [res.data.message || 'Request failed'];
        
            showToast(messages.join('<br>'), 'error');
            loading(false);
            return;
        } else {
            console.log("success", res);
            success(res.data);
            loading(false);
        }
    });
}
$.form_edit = async ({url, id, formId, formData, validation = {rules: {}, messages: {}}, success = () => {}}) => {
  loading();
  const curl = new CUrl;
  curl.json();
  const res = await curl.connect(url + "/" + id, "GET");
  console.log(res);
  Object.keys(res.data).forEach(key => {
    if (document.getElementById(key)) {
      document.getElementById(key).value = res.data[key];
    }
  });
  loading(false);
  const form = document.getElementById(formId);
  if (form == undefined) return;
  form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = formData();
      const validator = new Validator(data, validation.rules, validation.messages);
      const errors = validator.validate();

      if (errors.length) {
          showToast(errors.join("<br/>"), "error");
          return;
      }

      loading();
      const curl = new CUrl;
      curl.json();
      const res = await curl.connect(url + "/" + id, "PUT", data);
      console.log(res);
      if (res.status != 200) {
          const messages = res.data.errors
                      ? Object.values(res.data.errors).flat()
                      : [res.data.message || 'Request failed'];
      
          toast(messages.join('<br>'), 'error');
          loading(false);
          return;
      } else {
          console.log("success", res);
          success(res.data);
          loading(false);
      }
  });
}
$.table = ({ url, table, renderItem, limit = 10 }) => {

    let page = 1;
    let pagination = null;
  
    const list = async () => {
      loading();
      const curl = new CUrl;
      curl.json();
      const res = await curl.connect(`${url}?page=${page}&limit=${limit}`, "GET");
      console.log(res);
  
      if (res.status != 200) {
        const messages = res.data.errors
          ? Object.values(res.data.errors).flat()
          : [res.data.message || 'Request failed'];
        showToast(messages.join("<br/>"), "error");
        loading(false);
        return;
      } else {
        pagination = res.data.pagination;
        render(res.data.data);
        loading(false);
      }
    };
  
    const render = (items) => {
      const tableEl = document.getElementById(table);
  
      tableEl.innerHTML =
        items.map(item => renderItem(item)).join("") +
        renderPagination();
    };
  
    const renderPagination = () => {
      if (!pagination) return "";
  
      const totalPages = pagination.totalPages;
      let pages = "";
  
      for (let i = 1; i <= totalPages; i++) {
        pages += `
          <button 
            data-page="${i}"
            class="px-3 py-1.5 text-sm rounded-md border transition
              ${i === page
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}">
            ${i}
          </button>
        `;
      }
  
      return `
        <tr>
          <td colspan="4" class="px-4 py-4 bg-gray-50">
            <div class="flex items-center justify-between">
  
              <div class="text-sm text-gray-500">
                Page ${page} of ${totalPages}
                <span class="ml-2">• ${pagination.total} pages</span>
              </div>
  
              <div class="flex items-center gap-2">
  
                <button 
                  data-prev
                  ${page === 1 ? "disabled" : ""}
                  class="px-3 py-1.5 text-sm rounded-md border transition
                    ${page === 1
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}">
                  Prev
                </button>
  
                ${pages}
  
                <button 
                  data-next
                  ${!pagination?.hasNext ? "disabled" : ""}
                  class="px-3 py-1.5 text-sm rounded-md border transition
                    ${!pagination?.hasNext
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}">
                  Next
                </button>
  
              </div>
            </div>
          </td>
        </tr>
      `;
    };
  
    const remove = async (id) => {
      if (confirm("Are you sure?")) {
        loading();
        const curl = new CUrl;
        curl.json();
        const res = await curl.connect(`${url}/${id}`, "DELETE");
        console.log(res);
  
        if (res.status != 200) {
          loading(false);
          return;
        } else {
          console.log("success", res);
          loading(false);
          list();
        }
      }
    };
  
    list();

    document.getElementById(table).addEventListener("click", async (e) => {
      const id = e.target.dataset.id;

      if (e.target.matches("[data-delete]")) {
        remove(id);
      }

      if (e.target.matches("[data-prev]") && page > 1) {
        page--;
        list();
      }

      if (e.target.matches("[data-next]") && pagination?.hasNext) {
        page++;
        list();
      }

      if (e.target.matches("[data-page]")) {
        page = Number(e.target.dataset.page);
        list();
      }
    });
  
    return { list };
};