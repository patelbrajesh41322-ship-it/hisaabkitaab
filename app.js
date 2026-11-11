(function () {
  'use strict';

  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  var inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function rupee(n) { return '₹ ' + inr.format(Math.round(n)); }
  function rupee2(n) { return '₹ ' + inr2.format(n); }
  function val(f, name) { return parseFloat(f.elements[name].value); }

  function emiOf(P, r, n) {
    var i = r / 12 / 100;
    if (i === 0) return P / n;
    var g = Math.pow(1 + i, n);
    return P * i * g / (g - 1);
  }

  var calcs = {
    emi: function (f) {
      var P = val(f, 'amount'), r = val(f, 'rate'), t = val(f, 'tenure');
      var n = f.elements.unit.value === 'years' ? Math.round(t * 12) : Math.round(t);
      if (!(P > 0)) return { error: 'लोन की राशि 0 से ज़्यादा लिखिए।' };
      if (!(r >= 0) || r > 100) return { error: 'ब्याज दर 0 से 100 के बीच लिखिए।' };
      if (!(n >= 1)) return { error: 'अवधि कम से कम 1 महीना लिखिए।' };
      if (n > 600) return { error: 'अवधि 50 साल (600 महीने) तक ही लिखिए।' };
      var emi = emiOf(P, r, n), total = emi * n;
      return {
        head: ['हर महीने की EMI', rupee(emi)],
        rows: [
          ['लोन की राशि', rupee(P)],
          ['कुल ब्याज', rupee(total - P)],
          ['कुल भुगतान', rupee(total)],
          ['किश्तों की संख्या', n + ' महीने']
        ]
      };
    },

    homeloan: function (f) {
      var P = val(f, 'amount'), r = val(f, 'rate'), y = val(f, 'years');
      var n = Math.round(y * 12);
      if (!(P > 0)) return { error: 'होम लोन की राशि 0 से ज़्यादा लिखिए।' };
      if (!(r >= 0) || r > 100) return { error: 'ब्याज दर 0 से 100 के बीच लिखिए।' };
      if (!(n >= 12)) return { error: 'अवधि कम से कम 1 साल लिखिए।' };
      if (n > 600) return { error: 'अवधि 50 साल तक ही लिखिए।' };
      var i = r / 12 / 100, emi = emiOf(P, r, n), total = emi * n;
      var bal = P, open = P, yp = 0, yi = 0, rows = [];
      for (var m = 1; m <= n; m++) {
        var interest = bal * i;
        var princ = (m === n) ? bal : emi - interest;
        yp += princ; yi += interest; bal -= princ;
        if (m % 12 === 0 || m === n) {
          rows.push(['साल ' + Math.ceil(m / 12), rupee(open), rupee(yp), rupee(yi), rupee(Math.max(bal, 0))]);
          yp = 0; yi = 0; open = bal;
        }
      }
      return {
        head: ['हर महीने की EMI', rupee(emi)],
        rows: [
          ['होम लोन की राशि', rupee(P)],
          ['कुल ब्याज', rupee(total - P)],
          ['कुल भुगतान', rupee(total)],
          ['किश्तों की संख्या', n + ' महीने']
        ],
        table: {
          title: 'साल-दर-साल हिसाब',
          cols: ['साल', 'शुरू में बाकी', 'मूलधन चुकाया', 'ब्याज चुकाया', 'अंत में बाकी'],
          rows: rows
        }
      };
    },

    sip: function (f) {
      var M = val(f, 'monthly'), r = val(f, 'rate'), y = val(f, 'years');
      var n = Math.round(y * 12);
      if (!(M > 0)) return { error: 'हर महीने की रकम 0 से ज़्यादा लिखिए।' };
      if (!(r >= 0) || r > 100) return { error: 'रिटर्न 0 से 100 के बीच लिखिए।' };
      if (!(n >= 1)) return { error: 'समय कम से कम 1 महीना लिखिए।' };
      if (n > 600) return { error: 'समय 50 साल तक ही लिखिए।' };
      var i = r / 12 / 100, fv;
      if (i === 0) { fv = M * n; }
      else { fv = M * ((Math.pow(1 + i, n) - 1) / i) * (1 + i); }
      var invested = M * n;
      return {
        head: ['अनुमानित कुल रकम', rupee(fv)],
        rows: [
          ['कुल निवेश', rupee(invested)],
          ['अनुमानित कमाई', rupee(fv - invested)],
          ['निवेश की अवधि', n + ' महीने']
        ]
      };
    },

    gst: function (f) {
      var A = val(f, 'amount'), r = val(f, 'rate');
      var mode = f.elements.mode.value;
      if (!(A > 0)) return { error: 'रकम 0 से ज़्यादा लिखिए।' };
      if (!(r >= 0) || r > 100) return { error: 'GST दर 0 से 100 के बीच चुनिए।' };
      var base, gst, total;
      if (mode === 'add') { base = A; gst = A * r / 100; total = A + gst; }
      else { total = A; base = A / (1 + r / 100); gst = A - base; }
      return {
        head: mode === 'add' ? ['GST जोड़ने के बाद कुल रकम', rupee2(total)] : ['GST हटाने के बाद मूल रकम', rupee2(base)],
        rows: [
          ['GST से पहले की रकम', rupee2(base)],
          ['कुल GST (' + r + '%)', rupee2(gst)],
          ['CGST (आधा)', rupee2(gst / 2)],
          ['SGST / UTGST (आधा)', rupee2(gst / 2)],
          ['GST के साथ कुल रकम', rupee2(total)]
        ]
      };
    }
  };

  if (typeof module !== 'undefined') { module.exports = calcs; }
  if (typeof document === 'undefined') { return; }

  var form = document.querySelector('form[data-calc]');
  var out = document.getElementById('result');
  if (!form || !out) { return; }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderTable(t) {
    var wrap = el('div', 'tablewrap');
    wrap.appendChild(el('p', 'table-title', t.title));
    var scroll = el('div', 'tablescroll');
    var table = el('table');
    var thead = el('thead'), hr = el('tr');
    t.cols.forEach(function (c) { hr.appendChild(el('th', '', c)); });
    thead.appendChild(hr); table.appendChild(thead);
    var tbody = el('tbody');
    t.rows.forEach(function (row) {
      var tr = el('tr');
      row.forEach(function (cell) { tr.appendChild(el('td', '', cell)); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); scroll.appendChild(table); wrap.appendChild(scroll);
    return wrap;
  }

  function render(r) {
    out.hidden = false;
    out.textContent = '';
    if (r.error) { out.appendChild(el('p', 'err', r.error)); return; }
    var head = el('div', 'head');
    head.appendChild(el('span', 'head-label', r.head[0]));
    head.appendChild(el('strong', 'head-value', r.head[1]));
    out.appendChild(head);
    var ul = el('ul', 'ledger');
    r.rows.forEach(function (row) {
      var li = el('li');
      li.appendChild(el('span', 'k', row[0]));
      li.appendChild(el('span', 'dots'));
      li.appendChild(el('span', 'v', row[1]));
      ul.appendChild(li);
    });
    out.appendChild(ul);
    if (r.table) { out.appendChild(renderTable(r.table)); }
    out.appendChild(el('p', 'note', 'नतीजे अनुमान हैं, सलाह नहीं।'));
  }

  function run() { render(calcs[form.getAttribute('data-calc')](form)); }
  form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  run();
})();
