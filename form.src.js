cmsDefine(['jquery'], () => {

    return class Form {
        constructor(...args) {
            let form;
            let params;

            if (
                args.length === 1 &&
                args[0].constructor &&
                Object.prototype.toString.call(args[0]).slice(8, -1) === 'Object'
            ) {
                params = args[0];
            } else {
                [form, params] = args;
            }

            params = Object.assign({}, params);

            if (!params) params = {};

            if (form && !params.form) params.form = form;

            if (
                params.form &&
                typeof params.form === 'string'
            ) {
                form = params.form;
            }

            Object.assign(this, {
                form,
                $form: $(form),
                elements: form.elements,
                $elements: $(form.elements),
                container: form.querySelector('[data-form-container]') ?? form.firstElementChild,

                ...params
            })

            this.init();
        }


        init() {
            const { toggleElements, multistep, onSubmit, elements, form } = this;

            try {
                if (toggleElements) {
                    this.setShowEvents(toggleElements);
                }
                if (multistep) {
                    this.initMultiStep();
                }

                this.addSubmitListener(onSubmit);
            } catch (error) {
                this.logError('Init error:', error);
            }
        }


        // DEPRECATED (29.03.23)
        // Вызов всех переданных методов по ключу (если нет таких, то return) (не знаю насколько удобно, потестим, метод под большим вопросом)
        loadMethods(methods) {
            try {
                Object.entries(methods).forEach(method => {
                    const [key, value] = method;
                    if (typeof this[key] === 'function') {
                        return this[key](value);
                    } else if (typeof super[key] === 'function') {
                        return super[key](value);
                    } else return;
                })
            } catch (error) {
                this.logWarn('Load method error:', error);
            }
        }

        // Ошибка в консоль
        logError(text, error = '') {
            console.error(text, error);
        }

        // Предупреждение в консоль
        logWarn(text, error = '') {
            console.warn(text, error)
        }

        // Возвращает один jquery-object с искомым элементом
        getElement(elem) {
            return this.$elements.filter((_, $element) => $element.name === elem);
        }

        // Возвращает массив jquery-object'ов с искомыми элементами
        getElements(elements) {
            if (!elements.length) return [];
            const elementsArray = [];
            elements.forEach(elem => {
                const $elem = this.getElement(elem);
                elementsArray.push($elem);
            })
            return elementsArray;
        }

        // Возвращает объект Map() для setShowEvents
        makeShowingMap(elements) {
            const map = new Map;

            Object.entries(elements).forEach((elem) => {
                const [key, value] = elem;
                const inputToClick = this.getElement(key);
                const inputToShow = Array.isArray(value) ? this.getElements(value) : [this.getElement(value)];

                map.set(inputToClick, inputToShow);
            });

            return map;
        }

        // Обработчик показа/скрытия блока
        addShowEvent($el, elementsToShow) {
            $el.off('change.show-sibling').on('change.show-sibling', (e) => {
                const $target = $(e.currentTarget);

                switch ($target.prop('type')) {
                    case 'checkbox':
                    case 'radio':
                        elementsToShow.forEach($elemToShow => $elemToShow.closest('[class*=__inner]')[$target.is(':checked') ? 'show' : 'hide']());
                        break;
                    case 'text':
                    case 'select-one':
                        elementsToShow.forEach($elemToShow => $elemToShow.closest('[class*=__inner]')[$target.val() !== '' ? 'show' : 'hide']());
                        break;
                    default:
                        elementsToShow.forEach($elemToShow => $elemToShow.closest('[class*=__inner]')[$target.val() !== '' ? 'show' : 'hide']());
                        break;
                }
            }).trigger('change.show-sibling');
        }

        // Добавление обработчиков показа/скрытия блокам
        setShowEvents(elements) {
            if (!Object.keys(elements).length) return console.warn('No elements', this.setShowEvents.name);

            const elementsMap = this.makeShowingMap(elements);

            for (const [item, value] of elementsMap) {
                this.addShowEvent(item, value)
            }
        }

        // Валидация данных при отправке формы
        validateData(arrToValidate = this.$elements) {
            const post = this.$form.serializeArray();

            arrToValidate.filter('[name][data-required="Y"]').each((_, input) => {
                if (!$.map(post, (o) => {
                    if (o.name == input.name && o.value) return true;
                }).length) {
                    post.error = true;
                    if (!post.focusElem) post.focusElem = input;
                    this.setErrorOnInput(input);
                }
            });

            if (this.$form && this.$elements && this.$elements['g-recaptcha-response']) {
                if (!$(this.$elements['g-recaptcha-response']).val()) {
                    $(this.$elements['g-recaptcha-response']).closest('.field').addClass('error');
                    post.error = true;
                } else {
                    $(this.$elements['g-recaptcha-response']).closest('.field').removeClass('error');
                }
            }

            return post;
        }

        // Установка ошибки поля формы
        setErrorOnInput(el) {
            const $el = $(el);

            if ($el.hasClass('error')) return;

            $el.addClass('error').closest('.input-border').addClass('error');

            let $list = $el,
                name = el.name;

            if (name) {
                this.$form.find('[name][data-required="Y"]').not($el).each(() => {
                    if (el.name === name) $list = $list.add(el);
                });
            }

            $list.one('click keypress show.bs.select', () => {
                $list.each((_, elem) => {
                    $(`[name='${elem.name}']`).removeClass('error').closest('.input-border').removeClass('error');
                });
            });
        }

        scrollToElem(elem = null) {
            if (elem) {
                $('body, html').stop().animate({ scrollTop: ($(elem).offset().top - $('header').height()) - 20 }, () => {
                    $(elem).focus();
                });
            }
        }

        // Добавление события на onSubmit формы
        addSubmitListener(callback = null) {
            this.$form.off('submit.custom-submit').on('submit.custom-submit', (e) => {
                e.preventDefault();
                const result = this.validateData();

                if (result.error) {
                    this.scrollToElem(result.focusElem);
                    return this.logError('Validate data error');
                }

                if (callback) {
                    return callback(result);
                }

                e.currentTarget.submit();
            })
        }
    }
})