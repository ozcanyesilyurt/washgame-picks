
(function () {
  "use strict";
  var root = document.getElementById("page");
  if (!root) return;
  var JOB = root.dataset.job;
  var SCRIPT = root.dataset.script;
  var KEY = "assetgen.picks." + JOB;
  var data = JSON.parse(document.getElementById("candidates").textContent);

  var store = {
    read: function () {
      try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; }
    },
    write: function (v) {
      try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ }
    }
  };
  var picks = store.read();

  function byId(id) {
    for (var i = 0; i < data.length; i++) if (data[i].id === id) return data[i];
    return null;
  }

  function summaryText() {
    var lines = [];
    for (var i = 0; i < data.length; i++) {
      var c = data[i];
      if (picks[c.crop] !== c.id) continue;
      var tris = c.triangles == null ? "unknown" : Number(c.triangles).toLocaleString("en-US");
      lines.push(c.crop + ": " + c.providerLabel + ", " + tris + " triangles");
    }
    return lines.join("\n");
  }

  function commandText() {
    var args = [];
    for (var i = 0; i < data.length; i++) {
      var c = data[i];
      if (picks[c.crop] === c.id) args.push(c.crop + "=" + c.id);
    }
    if (!args.length) return "";
    return "python " + SCRIPT + " pick " + JOB + " " + args.join(" ");
  }

  function render() {
    var cards = document.querySelectorAll(".cand");
    for (var i = 0; i < cards.length; i++) {
      var el = cards[i];
      var on = picks[el.dataset.crop] === el.dataset.candidate;
      el.classList.toggle("picked", on);
      var btn = el.querySelector("button.pick");
      if (btn && !btn.disabled) btn.textContent = on ? "Picked" : "Pick this one";
    }
    var summary = summaryText();
    var bar = document.getElementById("bar");
    bar.hidden = !summary;
    if (summary) {
      document.getElementById("summary").textContent = summary;
      document.getElementById("command").textContent = commandText();
    }
  }

  function copy(el, button) {
    var text = el.textContent;
    var done = function () {
      var was = button.textContent;
      button.textContent = "Copied";
      setTimeout(function () { button.textContent = was; }, 1400);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { select(el); });
      return;
    }
    select(el);
    try { if (document.execCommand("copy")) done(); } catch (e) { /* selection is the fallback */ }
  }

  function select(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  var buttons = document.querySelectorAll("button.pick");
  for (var b = 0; b < buttons.length; b++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        var el = btn.closest(".cand");
        if (picks[el.dataset.crop] === el.dataset.candidate) delete picks[el.dataset.crop];
        else picks[el.dataset.crop] = el.dataset.candidate;
        store.write(picks);
        render();
      });
    })(buttons[b]);
  }

  document.getElementById("copy-summary").addEventListener("click", function (e) {
    copy(document.getElementById("summary"), e.currentTarget);
  });
  document.getElementById("copy-command").addEventListener("click", function (e) {
    copy(document.getElementById("command"), e.currentTarget);
  });

  render();
})();
