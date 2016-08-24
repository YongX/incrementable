class Incrementable {
  constructor(textField, multiplier, units='|%|deg|px|r?em|ex|ch|in|cm|mm|pt|pc|vmin|vmax|vw|vh|gd|m?s') {
    this.step = +textField.getAttribute('step') || +textField.getAttribute('data-step') || 1;
    this.changed = false;
    // this.multiplier = multiplier || this.getMultiplier;
    this.units = units;
    this.bindEvent(textField);
  }

  stepValue(length, decrement, multiplier) {
    const val = parseFloat(length);
    const offset = (decrement ? -1 : 1) * (multiplier || 1) * this.step;
    const valPrecision = Incrementable.precision(val);
    const offsetPrecision = Incrementable.precision(offset);

    // Prevent rounding errors
    const newVal = (parseFloat((val + offset).toPrecision(
      Math.max(valPrecision.integer, offsetPrecision.integer) +
      Math.max(valPrecision.decimals, offsetPrecision.decimals)
    )));

    return newVal + length.replace(/^-|[0-9]+|\./g, '');
  }

  static precision(number) {
    number = (number + '').replace(/^0+/, '');
    var dot = number.indexOf('.');
    if (dot === -1) {
      return {
        integer: number.length,
        decimals: 0
      };
    }
    return {
      integer: dot,
      decimals: number.length - 1 - dot
    }
  }

  static getMultiplier(evt) {
    if (evt.altKey) {
      return 0.1;
    } else if (evt.shiftKey) {
      return 10;
    } else {
      return 1;
    }
  }

  bindEvent(element) {
    const me = this;
    element.addEventListener('keydown', function (e) {
      let caret = this.selectionStart || 0;
      const reg = new RegExp('^([\\s\\S]{0,' + caret + '}[^-0-9\\.])?(-?[0-9]*(?:\\.?[0-9]+)(?:' + me.units +
        '))\\b', 'i');

      if (e.keyCode === 38 || e.keyCode === 40) {
        me.changed = false;
        // 上箭头
        this.value = this.value.replace(reg, (m, $1, $2) => {
          if ($1.length <= caret && $1.length + $2.length >= caret) {
            var stepV = me.stepValue($2, e.keyCode === 40, Incrementable.getMultiplier(e));
            caret = caret + (stepV.length - $2.length);
            me.changed = {
              add: stepV,
              del: $2,
              start: $1.length
            };
            return $1 + stepV;
          } else {
            return $1 + $2;
          }
        })
      }
      if (me.changed) {
        // notice 似乎需要在设置完值之后才能设置鼠标的位置?!!
        this.setSelectionRange(caret, caret);

        e.preventDefault();
        e.stopPropagation();

        // Fire input event
        var evt = document.createEvent("HTMLEvents");

        evt.initEvent('input', true, true);

        evt.add = me.changed.add;
        evt.del = me.changed.del;
        evt.start = me.changed.start;
        evt.incrementable = true;

        this.dispatchEvent(evt);
        me.changed = false;
      }
    });
  }
}
