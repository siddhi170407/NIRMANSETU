from django.db import migrations


ROLE_NAMES = ("Administrator", "Project Manager", "Inspector", "Contractor", "Auditor")


def seed_roles(apps, schema_editor):
    group = apps.get_model("auth", "Group")
    for name in ROLE_NAMES:
        group.objects.using(schema_editor.connection.alias).get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [("infrastructure", "0001_initial"), ("auth", "0012_alter_user_first_name_max_length")]
    # Never delete groups or their existing memberships on reversal.
    operations = [migrations.RunPython(seed_roles, migrations.RunPython.noop)]
