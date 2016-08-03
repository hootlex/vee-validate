import rules from './rules';
import ErrorBag from './errorBag';

export default class Validator
{
    constructor(validations) {
        this.validations = this.normalize(validations);
        this.errorBag = new ErrorBag();
        this.rules = rules;
    }

    attach(name, checks) {
        checks.split('|').forEach(rule => {
            if (! this.validations[name]) {
                this.validations[name] = [];
            }

            this.validations[name].push(this.normalizeRule(rule));
        });
    }

    detach(name) {
        delete this.validations[name];
    }

    static create(validations) {
        return new Validator(validations);
    }

    validateAll(values) {
        let test = true;
        this.errorBag.clear();
        Object.keys(values).forEach(property => {
            test = this.validate(property, values[property]);
        });

        return test;
    }

    validate(name, value) {
        let test = true;
        this.errorBag.remove(name);
        this.validations[name].forEach(rule => {
            test = this.test(name, value, rule);
        });

        return test;
    }

    /**
     * Normalizes the validations object.
     * @param  {object} validations
     * @return {object} Normalized object.
     */
    normalize(validations) {
        if (! validations) {
            return {};
        }

        const normalized = {};
        Object.keys(validations).forEach(property => {
            validations[property].split('|').forEach(rule => {
                if (! normalized[property]) {
                    normalized[property] = [];
                }

                normalized[property].push(this.normalizeRule(rule));
            });
        });

        return normalized;
    }

    normalizeRule(rule) {
        let params = null;
        if (~rule.indexOf(':')) {
            params = rule.split(':')[1].split(',');
        }

        return {
            name: rule.split(':')[0],
            params
        };
    }

    /**
     * test a single input value against a rule.
     *
     * @param  {*} name The name of the field.
     * @param  {*} value  [description]
     * @param  {object} rule the rule object.
     * @return {boolean} Wether if it passes the check.
     */
    test(name, value, rule) {
        const validator = this.rules[rule.name];
        const valid = validator.validate(value, rule.params);

        if (valid instanceof Promise) {
            return valid.then(values => {
                const allValid = values.reduce((prev, curr) => prev && curr.valid, true);

                if (! allValid) {
                    this.errorBag.add(name, validator.msg(name, rule.params));
                }

                return allValid;
            });
        }

        if (! valid) {
            this.errorBag.add(name, validator.msg(name, rule.params));
        }

        return valid;
    }

    /**
     * Gets the internal errorBag instance.
     * @return {ErrorBag} The internal error bag object.
     */
    getErrors() {
        return this.errorBag;
    }
}