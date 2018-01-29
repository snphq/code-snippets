module Translatable
  extend ActiveSupport::Concern

  included do
    attr_accessor :language

    def self.add_tranlation_fields(fields, &block)
      fields = [fields] unless fields.is_a? Array
      fields.each do |field|
        attr_writer field
        define_method(field) do |locale = I18n.locale|
          I18n.t(translation_key(field), default: nil, locale: locale.to_s.downcase)
        end
      end
      define_constants_and_methods(fields, &block)
    end

    def self.define_constants_and_methods(fields, &block)
      if block_given?
        const_set('CUSTOM_TRANSLATION_FIELDS', fields)
        define_method :add_translation_for, &block
      else
        const_set('TRANSLATION_FIELDS', fields)
      end
    end

    class << self
      alias_method :add_tranlation_field, :add_tranlation_fields
    end

    after_commit do
      if defined? self.class::TRANSLATION_FIELDS
        hash = Hash[self.class::TRANSLATION_FIELDS.map { |field| [field, instance_variable_get("@#{field}")] }]
        add_translations(language || I18n.default_locale, hash)
        I18n.backend.reload!
      end
    end

    after_commit do
      if defined? self.class::CUSTOM_TRANSLATION_FIELDS
        self.class::CUSTOM_TRANSLATION_FIELDS.each do |custom_translatable_field|
          add_translation_for(custom_translatable_field)
        end
        I18n.backend.reload!
      end
    end

    def translation_key(attribute)
      "#{self.class.name.downcase.gsub('::', '_')}.#{attribute}.#{id}"
    end

    def create_translation(locale, attribute, value)
      ActiveRecord::Base.transaction do
        translation = Translation.find_or_create_by(locale: locale, key: translation_key(attribute))
        translation.update(value: value) if translation.value != value
      end
    end

    private

    def add_translations(translated_language, attributes = {})
      language_code = translated_language.downcase
      attributes.select { |_k, v| v.present? }.each do |attribute, value|
        create_translation(language_code, attribute, value)
        Language.where.not(code: language_code.to_s.upcase).pluck(:code).map(&:downcase).each do |language|
          translated_value = Translator.translate(value, from: language_code, to: language)
          create_translation(language, attribute, translated_value)
        end
      end
    end
  end
end
