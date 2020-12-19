(function ($) {
    $.fn.searchParams = function (method) {
        if (_public.methods[method]) {
            return _public.methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return _public.methods.init.apply(this, arguments);
        } else {
            $.error('jQuery.searchParams: Method `' + method + '` is undefined');
        }
    };

    // Публичные методы и данные
    let _public = {
        methods: {
            init: function (options) {
                let settings = $.extend({
                    'plusDirection': 'top',
                    'selectOptions': [],
                    'customRowType': []
                }, options);

                if (settings.selectOptions.length === 0) {
                    $.error('jQuery.searchParams: options.selectOptions required');
                    return
                }

                if (settings.plusDirection !== 'top' && settings.plusDirection !== 'bottom') {
                    $.error('jQuery.searchParams: options.plusDirection can be only "top" or "bottom"');
                    return;
                }

                _private.var.globalCtx = this
                _private.var.globalSettings = options

                _private.methods.initRowsMap()
                this.append('<div class="col-lg-12" type="sp_wrapper"></div>')
                _private.methods.addRow(this, settings.selectOptions)
            },
            rowsCount: function () {
                return _private.var.rowsCount
            },
            jsonMarshal: function () {
                // TODO: возвращает JSON строку со всеми параметрами фильтров. Строка пригодна сразу к отправке на бэк
            },
            jsonUnmarshal: function () {
                // TODO: Парсит json строку и устанавливает параметры фильтров в соответствии с данными из json
            }
        }
    };

    // Приватные методы и данные
    let _private = {
        methods: {
            addRow: function () {
                _private.methods.removePlus() // Удалили кнопку '+'

                // Формируем новую строку
                let row = $(_private.const.rowBaseTmpl)
                _private.methods.addSelect(row) // Добавили select
                _private.methods.addValue(row) // Добавили input
                _private.methods.addCross(row) // Добавили кнопку 'x'

                // Поместили сформированную строку на страницу
                _private.var.globalCtx.find('[type="sp_wrapper"]').append(row)
                _private.var.rowsCount++

                _private.methods.addPlus() // Добавили кнопку '+'
            },
            addSelect: function (row) {
                row.find('[type="sp_select"]').append(_private.methods.getSelect(row))
            },
            addValue: function (row) {
                row.find('[type="sp_value"]').append(_private.var.rowsTypeMap.get(row.find('[type="sp_select"]').find('select option:selected').attr('s_type')))
            },
            changeValue: function (row, l_ctx) {
                row.find('[type="sp_value"]').html(_private.var.rowsTypeMap.get(
                    $(l_ctx[0].options[l_ctx[0].options.selectedIndex]).attr('s_type')
                ))
            },
            addPlus: function () {
                let btn = $(`<button class="btn btn-outline-success btn-block"><i class="fa fa-plus" aria-hidden="true"></i></button>`)
                btn.on('click', function () {
                    _private.methods.addRow()
                })

                if (_private.var.globalSettings.plusDirection === 'top') {
                    $(_private.var.globalCtx.find('.row')[0]).find('[type="sp_plus"]').append(btn)
                } else {
                    _private.var.globalCtx.find('.row').last().find('[type="sp_plus"]').append(btn)
                }
            },
            removePlus: function () {
                _private.var.globalCtx.find('[type="sp_plus"]').find('button').remove()
            },
            addCross: function (row) {
                let btn = $(`<button class="btn btn-outline-danger btn-block"><i class="fa fa-times" aria-hidden="true"></i></button>`)
                btn.on('click', function () {
                    _private.methods.removeRow(row)
                })
                row.find('[type="sp_cross"]').append(btn)
            },
            removeRow: function (row) {
                row.remove()
                _private.var.rowsCount--

                if (_private.methods.isEmpty()) {
                    _private.methods.addRow()
                } else {
                    _private.methods.removePlus()
                    _private.methods.addPlus()
                }
            },
            isEmpty: function () {
                return _private.var.rowsCount === 0
            },
            getSelect: function (row) {
                let select = $(`<select class="form-control"></select>`)

                for (let i = 0; i < _private.var.globalSettings.selectOptions.length; i++) {
                    let opt = $(`<option></option>`)
                    opt.attr('name', _private.var.globalSettings.selectOptions[i].name)
                    opt.attr('s_type', _private.var.globalSettings.selectOptions[i].type)
                    opt.append(_private.var.globalSettings.selectOptions[i].tittle)
                    select.append(opt)
                }

                for (let i = 0; i < _private.var.globalSettings.customRowType.length; i++) {
                    let opt = $(`<option></option>`)
                    opt.attr('name', _private.var.globalSettings.customRowType[i].name)
                    opt.attr('s_type', _private.var.globalSettings.customRowType[i].type)
                    opt.append(_private.var.globalSettings.customRowType[i].tittle)
                    select.append(opt)
                }

                select.on('change', function () {
                    _private.methods.changeValue(row, $(this))
                })

                return select
            },
            initRowsMap: function () {
                _private.var.rowsTypeMap = new Map()
                _private.var.rowsTypeMap.set('text', `<input class="form-control" type="text">`)
                _private.var.rowsTypeMap.set('color', `<input class="form-control" type="color">`)
                _private.var.rowsTypeMap.set('number', `<input class="form-control" type="number">`)
                _private.var.rowsTypeMap.set('date', `<input class="form-control" type="date">`)

                let c_rt = _private.var.globalSettings.customRowType
                if (c_rt === undefined || c_rt.length === 0) {
                    return
                }

                for (let i = 0; i < c_rt.length; i++) {
                    if (c_rt[i].type.startsWith('select')) {
                        // Особая логика для select
                        let select = $(`<select class="form-control"></select>`)
                        $(c_rt[i].params).each(function (n) {
                            let opt = $(`<option></option>`)
                            opt.attr('name', c_rt[i].params[n].value)
                            opt.append(c_rt[i].params[n].tittle)
                            select.append(opt)
                        })
                        _private.var.rowsTypeMap.set(c_rt[i].type, select[0].outerHTML)
                        console.log('_private.var.rowsTypeMap', _private.var.rowsTypeMap)
                    } else {
                        _private.var.rowsTypeMap.set(c_rt[i].type, c_rt[i].code)
                    }
                }
            }
        },
        var: {
            globalCtx: undefined,
            globalSettings: undefined,
            rowsCount: 0,
            rowsTypeMap: {}
        },
        const: {
            rowBaseTmpl: `
                <div class="row">
                    <div class="col-lg-3 form-group" type="sp_select"></div>
                    <div class="col-lg-7 form-group" type="sp_value"></div>
                    <div class="col-lg-1 form-group" type="sp_cross"></div>
                    <div class="col-lg-1 form-group" type="sp_plus"></div>
                </div>`
        }
    }
})(jQuery);
