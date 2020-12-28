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
                    'customRowType': [],
                    'plusBtnClass': '',
                    'crossBtnClass': '',
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
                _private.methods.initSingleNamesMap()
                this.append('<div class="col-lg-12" type="sp_wrapper"></div>')
                _private.methods.addRow(this, settings.selectOptions)
            },
            rowsCount: function () {
                return _private.var.rowsCount
            },
            exportJSON: function () {
                let rows = $(_private.var.globalCtx).find('.row')
                let values = {}
                for (let i = 0; i < rows.length; i++) {
                    let select = $($(rows[i]).find('[type="sp_select"]').find('select')[0]).find('option:selected')
                    let name = select.attr('name')
                    let type = select.attr('s_type')
                    let value = ''
                    if (type.startsWith('select')) {
                        value = $($(rows[i]).find('[type="sp_value"]').find('select')[0]).find('option:selected').attr('name')
                    } else {
                        value = $(rows[i]).find('[type="sp_value"]').find('input').val()
                    }
                    if (value === '') {
                        continue
                    }
                    if (values[name] === undefined) {
                        values[name] = []
                    }
                    if (!_private.methods.isExists(values[name], value)) {
                        values[name].push(value)
                    }
                }

                if (Object.entries(values).length === 0) {
                    return undefined
                }

                return {values: values}
            },
            importJSON: function (json) {
                _private.var.globalCtx.find('[type="sp_wrapper"]').html('')
                for (const [name, value] of Object.entries(json.values)) {
                    for (let i = 0; i < value.length; i++) {
                        _private.methods.addRowWithParams(name, value[i])
                    }
                }
                _private.var.rowsCount = _private.var.globalCtx.find('.row').length
            },
            exportJsonStr: function () {
                return JSON.stringify(_public.methods.exportJSON())
            },
            importJsonStr: function (str) {
                _public.methods.importJSON(JSON.parse(str))
            },
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
                _private.methods.toggleSingleAvailability()
                _private.var.rowsCount++

                _private.methods.addPlus() // Добавили кнопку '+'
            },
            addRowWithParams: function (name, value) {
                _private.methods.removePlus() // Удалили кнопку '+'

                // Формируем новую строку
                let row = $(_private.const.rowBaseTmpl)
                _private.methods.addSelect(row) // Добавили select
                row.find(`select option[name="${name}"]`).prop('selected', true) // Переключили select
                _private.methods.addValue(row) // Добавили input

                if (row.find('input').length !== 0) {
                    row.find(('input')).val(value)
                } else {
                    row.find('[type="sp_value"]').find(`select option[name="${value}"]`).prop('selected', true)
                }

                _private.methods.addCross(row) // Добавили кнопку 'x'

                // Поместили сформированную строку на страницу
                _private.var.globalCtx.find('[type="sp_wrapper"]').append(row)
                _private.var.rowsCount++

                _private.methods.addPlus() // Добавили кнопку '+'
            },
            isExists: function (array, elem) {
                for (let i = 0; i < array.length; i++) {
                    if (array[i] === elem) {
                        return true
                    }
                }
                return false
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
                let btnClass
                if (_private.var.globalSettings.plusBtnClass === '') {
                    btnClass = 'btn btn-block btn-outline-success'
                } else {
                    btnClass = 'btn btn-block ' + _private.var.globalSettings.plusBtnClass
                }

                let btn = $(`<button class="${btnClass}"><i class="fa fa-plus" aria-hidden="true"></i></button>`)
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
                let btnClass
                if (_private.var.globalSettings.crossBtnClass === '') {
                    btnClass = 'btn btn-block btn-outline-danger'
                } else {
                    btnClass = 'btn btn-block ' + _private.var.globalSettings.crossBtnClass
                }

                let btn = $(`<button class="${btnClass}"><i class="fa fa-times" aria-hidden="true"></i></button>`)
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
                    _private.methods.addParam(select, _private.var.globalSettings.selectOptions[i])
                }

                for (let i = 0; i < _private.var.globalSettings.customRowType.length; i++) {
                    _private.methods.addParam(select, _private.var.globalSettings.customRowType[i])
                }

                select.on('change', function () {
                    _private.methods.changeValue(row, $(this))
                    _private.methods.toggleSingleAvailability()
                })

                return select
            },
            toggleSingleAvailability: function () {
                let opt = _private.var.globalCtx.find('[type="sp_select"]').find('option')
                opt.removeAttr('disabled')
                let selectedOpt = _private.var.globalCtx.find('[type="sp_select"]').find('option:selected')
                opt.each(function (i) {
                    let name = $(opt[i]).attr('name')
                    if (_private.var.singleNames[name]) {
                        for (let n = 0; n < selectedOpt.length; n++) {
                            if ($(selectedOpt[n]).attr('name') === name) {
                                let allUnique = _private.var.globalCtx.find('[type="sp_select"]').find(`option[name="${name}"]`)
                                allUnique.attr('disabled', true)
                            }
                        }
                    }
                })
            },
            addParam: function (select, option) {
                let opt = $(`<option></option>`)
                opt.attr('name', option.name)
                opt.attr('s_type', option.type)
                opt.append(option.tittle)
                select.append(opt)
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
                    } else {
                        _private.var.rowsTypeMap.set(c_rt[i].type, c_rt[i].code)
                    }
                }
            },
            initSingleNamesMap: function () {
                for (let i = 0; i < _private.var.globalSettings.selectOptions.length; i++) {
                    let opt = _private.var.globalSettings.selectOptions[i]
                    if (opt.isSingle === true) {
                        _private.var.singleNames[opt.name] = true
                    }
                }

                for (let i = 0; i < _private.var.globalSettings.customRowType.length; i++) {
                    let opt = _private.var.globalSettings.customRowType[i]
                    if (opt.isSingle === true) {
                        _private.var.singleNames[opt.name] = true
                    }
                }
            }
        },
        var: {
            globalCtx: undefined,
            globalSettings: undefined,
            rowsCount: 0,
            rowsTypeMap: {},
            singleNames: {},
            secretKey: `5aee0674d9cb426c8f7737d4d24072f2`
        },
        const: {
            rowBaseTmpl: '<div class="row"><div class="col-lg-3 form-group" type="sp_select"></div><div class="col-lg-7 form-group" type="sp_value"></div><div class="col-lg-1 form-group" type="sp_cross"></div><div class="col-lg-1 form-group" type="sp_plus"></div></div>'
        }
    }
})(jQuery);