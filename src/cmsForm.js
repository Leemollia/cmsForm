import { Multistep } from "./modules/multistep/multistep";
import { ToggleElements } from "./modules/toggleElements/toggleElements";

class cmsForm {
    constructor(...args) {
        let form;
        let params;
        let modules;

        if (args.length === 1 &&
            args[0].constructor &&
            Object.prototype.toString.call(args[0]).slice(8, -1) === 'Object'
        ) {
            params = args[0];
        } else {
            [form, params] = args;
        }

        // params = Object.assign({}, params);

        if (!params) params = {};

        if (form && !params.form) params.form = form;
        if (form && params.modules) modules = params.modules;

        if (
            params.form &&
            Object.prototype.toString.call(params.form).slice(8, -1) === 'HTMLFormElement'
        ) {
            form = params.form;
        } else {
            form = document.querySelector(params.form);
        }

        this.modules = [...this.__modules__];
        if (params.modules && Array.isArray(params.modules)) {
            this.modules.push(...params.modules);
        }

        
        this.modules.forEach((mod) => {
            mod({
                form: this,
            });
        });
        console.log(this)
        
        Object.assign(this, {
            form: form,
            elements: form.elements,
            container: form.querySelector('[data-form-container]'),
            modules: modules,

            ...params
        })

        this.init();

        return this;
    }


    init() {
        try {
            const { modules } = this;

            this.addEventListeners();
            if (modules) this.loadModules();
        } catch (error) {
            this.logError('Init error:', error);
        }
    }

    // Загрузка модулей
    loadModules(module) {
        // if (!this.modules) return;
        // module({ form: this.form, module: this.modules[module.name.toLowerCase()] })


        const modulesNames = Object.keys(this.modules);
        const modulesPaths = Object.keys(this.modules).map(module => 'myForm/modules/' + module);

        try {

            // cmsRequire(modulesPaths, (...moduleFn) => {
            //     moduleFn.forEach((Module, ind) => {
            //         Module({ form: this, module: this.modules[modulesNames[ind]] });
            //     })
            // })
        } catch (error) {
            this.logError('Load module error:', error);
        }
    }

    static installModule(mod) {
        if (!this.prototype.__modules__) this.prototype.__modules__ = [];
        const modules = this.prototype.__modules__;

        if (typeof mod === 'function' && modules.indexOf(mod) < 0) {
            modules.push(mod);
        }
    }

    static useModule(module) {
        if (Array.isArray(module)) {
            module.forEach((m) => this.installModule(m));
            return this;
          }
          this.installModule(module);
          return this;
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
        if (!elem) return this.logWarn('Error to get element')
        return this.elements.filter(element => element.name === elem);
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

    // Валидация данных при отправке формы
    validateData(arrToValidate = this.elements) {
        const post = arrToValidate.serializeArray();

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

    // Скролл до элемента
    scrollToElem(elem = null) {
        if (elem) {
            this.getScrollParent(elem)
                .stop()
                .animate({
                    scrollTop: ($(elem).offset().top - $('header').height()) - 20
                }, () => {
                    $(elem).focus();
                });
        }
    }

    // Поиск родителя со скроллом
    getScrollParent(node) {
        if (node == null) return $('body, html');

        return node.scrollHeight > node.clientHeight ? $(node) : this.getScrollParent(node.parentNode);
    }

    // Добавление eventListener'ов
    addEventListeners() {
        const { onSubmit } = this;
        this.addSubmitListener(onSubmit);
    }

    // Событие на submit формы
    addSubmitListener(callback = null) {
        this.form.addEventListener('submit', submitHandler);

        function submitHandler(e) {
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
        }
    }
}

cmsForm.useModule([ToggleElements]);

export default cmsForm;