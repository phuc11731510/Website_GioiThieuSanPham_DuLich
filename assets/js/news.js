document.addEventListener('DOMContentLoaded', () => {
  try { initDark(); } catch {}
  try { backtotop(); } catch {}
  loadProducts().then(() => { try { initHome(); } catch {} });
});

function backtotop(){
  let mybutton = document.getElementById('arrow');
  mybutton.onclick = function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }; 
function scrollFunction() {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      mybutton.style.display = "block";
    } else {
      mybutton.style.display = "none";
    }
  }
  window.onscroll = function() {
    scrollFunction();
  };

}
